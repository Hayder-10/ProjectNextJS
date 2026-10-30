import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { toPlain } from '@/lib/utils';
import Post from '@/models/Post';
import '@/models/User';

type Author = { _id: string; name: string; avatarUrl?: string } | null; // null si le compte a été supprimé

export type PostListItem = {
  _id: string;
  title: string;
  category: 'general' | 'match-talk' | 'transfers' | 'tactics';
  author: Author;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
};

export type PostDetail = {
  _id: string;
  title: string;
  content: string;
  category: PostListItem['category'];
  author: Author;
  likes: string[];
  replies: { _id: string; author: Author; content: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
};

export const POSTS_PER_PAGE = 10;

export async function listPosts({ category, author, page }: { category?: string; author?: string; page: number }) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (author && isValidObjectId(author)) filter.author = author;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE)
      .select('title category author likes replies createdAt')
      .populate('author', 'name avatarUrl')
      .lean(),
    Post.countDocuments(filter),
  ]);

  const items = posts.map((p) => ({
    _id: p._id,
    title: p.title,
    category: p.category,
    author: p.author,
    likesCount: p.likes.length,
    repliesCount: p.replies.length,
    createdAt: p.createdAt,
  }));
  return { posts: toPlain<PostListItem[]>(items), total };
}

export async function getLatestPosts(limit = 3) {
  const { posts } = await listPosts({ page: 1 });
  return posts.slice(0, limit);
}

export async function getPost(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const post = await Post.findById(id)
    .populate('author', 'name avatarUrl')
    .populate('replies.author', 'name avatarUrl')
    .lean();
  return post ? toPlain<PostDetail>(post) : null;
}
