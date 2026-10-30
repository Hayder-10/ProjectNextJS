'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { BOOKING_DAYS_AHEAD, bookingSchema, MAX_FUTURE_BOOKINGS, pitchSchema } from '@/lib/validation/booking';
import { firstError, objectId } from '@/lib/validation/common';
import { isFutureSlot } from '@/lib/queries/booking';
import { round3, todayString, toDateString, type ActionResult } from '@/lib/utils';
import Pitch from '@/models/Pitch';
import Booking from '@/models/Booking';

function revalidateBooking(pitchId?: string) {
  revalidatePath('/pitches');
  revalidatePath('/bookings');
  revalidatePath('/admin/pitches');
  if (pitchId) revalidatePath(`/pitches/${pitchId}`);
}

function parsePitchForm(formData: FormData) {
  return pitchSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get('isActive') === 'on' });
}

// ---------- Terrains (admin) ----------

export async function createPitch(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parsePitchForm(formData);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const { imageUrl, pricePerHour, ...rest } = parsed.data;
  await Pitch.create({ ...rest, pricePerHour: round3(pricePerHour), imageUrl: imageUrl || undefined });
  revalidateBooking();
  redirect('/admin/pitches?saved=created');
}

export async function updatePitch(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Terrain introuvable' };
  const parsed = parsePitchForm(formData);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const pitch = await Pitch.findById(id);
  if (!pitch) return { ok: false, error: 'Terrain introuvable' };

  const { imageUrl, pricePerHour, ...rest } = parsed.data;
  pitch.set({ ...rest, pricePerHour: round3(pricePerHour), imageUrl: imageUrl || undefined });
  await pitch.save();
  revalidateBooking(id);
  redirect('/admin/pitches?saved=updated');
}

/** Supprime le terrain, ou le désactive s'il a déjà des réservations */
export async function deletePitch(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Terrain introuvable' };

  await connectDB();
  if (await Booking.exists({ pitch: id })) {
    await Pitch.findByIdAndUpdate(id, { isActive: false });
  } else {
    await Pitch.findByIdAndDelete(id);
  }
  revalidateBooking(id);
  return { ok: true };
}

// ---------- Réservations ----------

/** Vérifie les règles communes à la création et au déplacement d'une réservation */
async function checkSlot(pitchId: string, formData: FormData, userId: string, ignoreBookingId?: string) {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { date, startHour } = parsed.data;

  const pitch = await Pitch.findById(pitchId);
  if (!pitch || !pitch.isActive) return { error: "Ce terrain n'est pas disponible" };
  if (startHour < pitch.openHour || startHour >= pitch.closeHour) {
    return { error: `Le terrain est ouvert de ${pitch.openHour}h à ${pitch.closeHour}h` };
  }

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + BOOKING_DAYS_AHEAD);
  if (date < todayString() || date > toDateString(maxDate)) {
    return { error: `Choisissez une date entre aujourd'hui et dans ${BOOKING_DAYS_AHEAD} jours` };
  }
  if (!isFutureSlot(date, startHour)) return { error: 'Ce créneau est déjà passé' };

  // Au plus 3 réservations futures actives par utilisateur
  const upcoming = await Booking.find({ user: userId, status: 'active', date: { $gte: todayString() } }).select('date startHour').lean();
  const futureCount = upcoming.filter(
    (b) => String(b._id) !== ignoreBookingId && isFutureSlot(b.date as string, b.startHour as number),
  ).length;
  if (futureCount >= MAX_FUTURE_BOOKINGS) {
    return { error: `Vous avez déjà ${MAX_FUTURE_BOOKINGS} réservations à venir` };
  }

  return { pitch, date, startHour };
}

function isDuplicateError(err: unknown) {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000;
}

export async function createBooking(pitchId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(pitchId).success) return { ok: false, error: 'Terrain introuvable' };
  await connectDB();

  const check = await checkSlot(pitchId, formData, user.id);
  if ('error' in check) return { ok: false, error: check.error! };

  try {
    await Booking.create({ pitch: pitchId, user: user.id, date: check.date, startHour: check.startHour, price: check.pitch.pricePerHour });
  } catch (err) {
    // L'index unique est la dernière protection contre la double réservation
    if (isDuplicateError(err)) return { ok: false, error: 'Ce créneau vient d\'être réservé' };
    throw err;
  }

  revalidateBooking(pitchId);
  redirect('/bookings');
}

export async function moveBooking(bookingId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(bookingId).success) return { ok: false, error: 'Réservation introuvable' };
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.status !== 'active') return { ok: false, error: 'Réservation introuvable' };
  if (booking.user.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };
  if (!isFutureSlot(booking.date, booking.startHour)) return { ok: false, error: 'Ce créneau a déjà commencé' };

  const check = await checkSlot(booking.pitch.toString(), formData, booking.user.toString(), bookingId);
  if ('error' in check) return { ok: false, error: check.error! };

  booking.date = check.date;
  booking.startHour = check.startHour;
  try {
    await booking.save();
  } catch (err) {
    if (isDuplicateError(err)) return { ok: false, error: 'Ce créneau vient d\'être réservé' };
    throw err;
  }

  revalidateBooking(booking.pitch.toString());
  return { ok: true, message: 'Réservation déplacée' };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(bookingId).success) return { ok: false, error: 'Réservation introuvable' };
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.status !== 'active') return { ok: false, error: 'Réservation introuvable' };
  if (booking.user.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };
  if (user.role !== 'admin' && !isFutureSlot(booking.date, booking.startHour)) {
    return { ok: false, error: 'Ce créneau a déjà commencé' };
  }

  booking.status = 'cancelled';
  await booking.save();
  revalidateBooking(booking.pitch.toString());
  return { ok: true };
}
