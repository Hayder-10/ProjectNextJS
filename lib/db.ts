import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI!;

// Connexion mise en cache sur globalThis : le rechargement à chaud n'ouvre pas de nouvelles connexions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = (globalThis as any).mongoose ?? { conn: null, promise: null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(uri);
  cached.conn = await cached.promise;
  return cached.conn;
}
