'use server';

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { sendPasswordResetOtp } from '@/lib/email';
import {
  registerSchema,
  profileSchema,
  passwordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation/users';
import { firstError, objectId } from '@/lib/validation/common';
import type { ActionResult } from '@/lib/utils';
import User from '@/models/User';
import MyTeam from '@/models/MyTeam';
import Team from '@/models/Team';
import Shop from '@/models/Shop';

export async function registerUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, email, password } = parsed.data;

  await connectDB();
  if (await User.exists({ email })) return { ok: false, error: 'E-mail déjà utilisé' };

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash });
  redirect('/login?registered=1');
}

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const sessionUser = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, city, avatarUrl, favoriteClub } = parsed.data;

  await connectDB();
  const user = await User.findById(sessionUser.id);
  if (!user) return { ok: false, error: 'Utilisateur introuvable' };

  user.name = name;
  user.city = city || undefined;
  user.avatarUrl = avatarUrl || undefined;
  user.favoriteClub = favoriteClub || undefined;
  await user.save();

  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true, message: 'Profil mis à jour' };
}

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const sessionUser = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const user = await User.findById(sessionUser.id).select('+passwordHash');
  if (!user) return { ok: false, error: 'Utilisateur introuvable' };

  const valid = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!valid) return { ok: false, error: 'Mot de passe actuel incorrect' };

  user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await user.save();
  return { ok: true, message: 'Mot de passe modifié' };
}

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');
  if (user) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtpHash = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.resetOtpAttempts = 0;
    await user.save();
    await sendPasswordResetOtp(user.email, user.name, otp);
  }

  return { ok: true, message: 'Si un compte existe avec cet e-mail, un code OTP a été envoyé.' };
}

export async function resetPasswordWithOtp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');
  if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
    return { ok: false, error: 'Code OTP invalide ou expiré' };
  }

  if (user.resetOtpExpires.getTime() < Date.now()) {
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();
    return { ok: false, error: 'Code OTP expiré. Veuillez en demander un nouveau.' };
  }

  if ((user.resetOtpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();
    return { ok: false, error: 'Trop de tentatives. Veuillez demander un nouveau code OTP.' };
  }

  const valid = await bcrypt.compare(parsed.data.otp, user.resetOtpHash);
  if (!valid) {
    user.resetOtpAttempts = (user.resetOtpAttempts ?? 0) + 1;
    await user.save();
    return { ok: false, error: 'Code OTP incorrect' };
  }

  user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();

  redirect('/login?reset=1');
}

/** Supprime le compte ; le client appelle ensuite signOut() */
export async function deleteMyAccount(): Promise<ActionResult> {
  const sessionUser = await requireUser();
  await connectDB();
  await User.findByIdAndDelete(sessionUser.id);
  await MyTeam.deleteMany({ owner: sessionUser.id });
  await Team.deleteMany({ owner: sessionUser.id });
  // La boutique est gardée pour la comptabilité, mais ne vend plus rien
  await Shop.updateOne({ owner: sessionUser.id }, { status: 'suspended' });
  return { ok: true };
}

export async function adminSetRole(userId: string, role: 'user' | 'admin'): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(userId).success || !['user', 'admin'].includes(role)) {
    return { ok: false, error: 'Données invalides' };
  }
  if (userId === admin.id) return { ok: false, error: 'Vous ne pouvez pas changer votre propre rôle' };

  await connectDB();
  await User.findByIdAndUpdate(userId, { role });
  revalidatePath('/admin/users');
  return { ok: true };
}

export async function adminDeleteUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(userId).success) return { ok: false, error: 'Identifiant invalide' };
  if (userId === admin.id) return { ok: false, error: 'Vous ne pouvez pas supprimer votre propre compte ici' };

  await connectDB();
  await User.findByIdAndDelete(userId);
  await MyTeam.deleteMany({ owner: userId });
  await Team.deleteMany({ owner: userId });
  await Shop.updateOne({ owner: userId }, { status: 'suspended' });
  revalidatePath('/admin/users');
  return { ok: true };
}
