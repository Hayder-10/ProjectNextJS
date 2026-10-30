import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { toPlain } from '@/lib/utils';
import Pitch from '@/models/Pitch';
import Booking from '@/models/Booking';
import '@/models/User';

export type PitchItem = {
  _id: string;
  name: string;
  city: string;
  address: string;
  type: '5v5' | '7v7' | '11v11';
  pricePerHour: number;
  openHour: number;
  closeHour: number;
  imageUrl?: string;
  isActive: boolean;
};

export type BookingItem = {
  _id: string;
  pitch: PitchItem | null;
  user: { _id: string; name: string; email: string } | string;
  date: string;
  startHour: number;
  status: 'active' | 'cancelled';
  price: number;
  createdAt: string;
};

/** Le créneau n'a pas encore commencé (heure locale du serveur) */
export function isFutureSlot(date: string, startHour: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, startHour) > new Date();
}

export async function listPitches({ city, type }: { city?: string; type?: string } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = { isActive: true };
  if (city) filter.city = city;
  if (type) filter.type = type;
  const pitches = await Pitch.find(filter).sort({ city: 1, name: 1 }).lean();
  return toPlain<PitchItem[]>(pitches);
}

export async function listAllPitches() {
  await connectDB();
  const pitches = await Pitch.find().sort({ isActive: -1, name: 1 }).lean();
  return toPlain<PitchItem[]>(pitches);
}

export async function listCities() {
  await connectDB();
  const cities: string[] = await Pitch.distinct('city', { isActive: true });
  return cities.sort();
}

export async function getPitch(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const pitch = await Pitch.findById(id).lean();
  return pitch ? toPlain<PitchItem>(pitch) : null;
}

/** Heures déjà réservées pour un terrain et un jour */
export async function getTakenHours(pitchId: string, date: string) {
  await connectDB();
  const bookings = await Booking.find({ pitch: pitchId, date, status: 'active' }).select('startHour').lean();
  return bookings.map((b) => b.startHour as number);
}

export async function listMyBookings(userId: string) {
  await connectDB();
  const bookings = await Booking.find({ user: userId }).sort({ date: -1, startHour: -1 }).populate('pitch').lean();
  return toPlain<BookingItem[]>(bookings);
}

export async function listAllBookings() {
  await connectDB();
  const bookings = await Booking.find().sort({ date: -1, startHour: -1 }).limit(200).populate('pitch').populate('user', 'name email').lean();
  return toPlain<BookingItem[]>(bookings);
}
