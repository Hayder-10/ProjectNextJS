'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { registerSchema, profileSchema, passwordSchema } from '@/lib/validation/users';
import { firstError, objectId } from '@/lib/validation/common';
import type { ActionResult } from '@/lib/utils';
import User from '@/models/User';
import MyTeam from '@/models/MyTeam';

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

/** Supprime le compte ; le client appelle ensuite signOut() */
export async function deleteMyAccount(): Promise<ActionResult> {
  const sessionUser = await requireUser();
  await connectDB();
  await User.findByIdAndDelete(sessionUser.id);
  await MyTeam.deleteMany({ owner: sessionUser.id });
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
  revalidatePath('/admin/users');
  return { ok: true };
}
