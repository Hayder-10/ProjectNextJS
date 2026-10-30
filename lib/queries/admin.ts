import { connectDB } from '@/lib/db';
import { escapeRegex, toPlain, todayString } from '@/lib/utils';
import type { MyTeamItem } from '@/lib/queries/myxi';
import User from '@/models/User';
import Post from '@/models/Post';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Booking from '@/models/Booking';
import Pitch from '@/models/Pitch';
import Tournament from '@/models/Tournament';
import MyTeam from '@/models/MyTeam';
import '@/models/Player';

/** Chiffres du tableau de bord admin */
export async function getDashboardStats() {
  await connectDB();
  const [users, posts, products, lowStock, pendingOrders, revenue, upcomingBookings, pitches, tournaments, teams] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: 3 } }),
    Order.countDocuments({ status: 'pending' }),
    // Chiffre d'affaires : toutes les commandes non annulées
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Booking.countDocuments({ status: 'active', date: { $gte: todayString() } }),
    Pitch.countDocuments({ isActive: true }),
    Tournament.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    MyTeam.countDocuments(),
  ]);

  const byStatus = Object.fromEntries(tournaments.map((t: { _id: string; count: number }) => [t._id, t.count]));
  return {
    users,
    posts,
    products,
    lowStock,
    pendingOrders,
    revenue: revenue[0]?.total ?? 0,
    upcomingBookings,
    pitches,
    tournaments: { open: byStatus.open ?? 0, ongoing: byStatus.ongoing ?? 0, finished: byStatus.finished ?? 0 },
    teams,
  };
}

export type AdminPostItem = {
  _id: string;
  title: string;
  category: 'general' | 'match-talk' | 'transfers' | 'tactics';
  author: { _id: string; name: string } | null;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
};

export async function listPostsForAdmin(q?: string) {
  await connectDB();
  const filter = q ? { title: { $regex: escapeRegex(q), $options: 'i' } } : {};
  const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(200).populate('author', 'name').lean();
  return toPlain<AdminPostItem[]>(
    posts.map((p) => ({ ...p, likesCount: p.likes.length, repliesCount: p.replies.length, likes: undefined, replies: undefined, content: undefined })),
  );
}

export type AdminTeamItem = Omit<MyTeamItem, 'owner' | 'players'> & { owner: { _id: string; name: string } | null; playersCount: number };

export async function listTeamsForAdmin() {
  await connectDB();
  const teams = await MyTeam.find().sort({ updatedAt: -1 }).limit(200).populate('owner', 'name').lean();
  return toPlain<AdminTeamItem[]>(teams.map((t) => ({ ...t, playersCount: t.players.length, players: undefined })));
}

export async function getLowStockProducts() {
  await connectDB();
  const products = await Product.find({ stock: { $lte: 3 } }).sort({ stock: 1 }).limit(5).select('name stock').lean();
  return toPlain<{ _id: string; name: string; stock: number }[]>(products);
}
