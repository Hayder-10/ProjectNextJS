import { connectDB } from '@/lib/db';
import { escapeRegex, toPlain } from '@/lib/utils';
import User from '@/models/User';

export type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  city?: string;
  favoriteClub?: string;
  createdAt: string;
};

// passwordHash a select: false dans le modèle : il n'est jamais renvoyé ici

export async function getUserById(id: string) {
  await connectDB();
  const user = await User.findById(id).lean();
  return user ? toPlain<UserItem>(user) : null;
}

export async function listUsers(q?: string) {
  await connectDB();
  const filter = q
    ? { $or: [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { email: { $regex: escapeRegex(q), $options: 'i' } }] }
    : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return toPlain<UserItem[]>(users);
}
