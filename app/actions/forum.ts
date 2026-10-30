'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { postSchema, replySchema } from '@/lib/validation/forum';
import { firstError, objectId } from '@/lib/validation/common';
import type { ActionResult } from '@/lib/utils';
import Post from '@/models/Post';

export async function createPost(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const post = await Post.create({ ...parsed.data, author: user.id });
  revalidatePath('/forum');
  revalidatePath('/');
  redirect(`/forum/${post._id}`);
}

export async function updatePost(postId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(postId).success) return { ok: false, error: 'Publication introuvable' };
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const post = await Post.findById(postId);
  if (!post) return { ok: false, error: 'Publication introuvable' };
  if (post.author.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };

  post.set(parsed.data);
  await post.save();
  revalidatePath('/forum');
  revalidatePath(`/forum/${postId}`);
  redirect(`/forum/${postId}`);
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(postId).success) return { ok: false, error: 'Publication introuvable' };

  await connectDB();
  const post = await Post.findById(postId);
  if (!post) return { ok: false, error: 'Publication introuvable' };
  if (post.author.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };

  await post.deleteOne();
  revalidatePath('/forum');
  revalidatePath('/');
  redirect('/forum');
}

export async function toggleLike(postId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(postId).success) return { ok: false, error: 'Publication introuvable' };

  await connectDB();
  const post = await Post.findById(postId).select('likes');
  if (!post) return { ok: false, error: 'Publication introuvable' };

  // $addToSet garantit qu'un utilisateur n'apparaît qu'une fois dans likes
  const liked = post.likes.some((id: unknown) => String(id) === user.id);
  await Post.updateOne({ _id: postId }, liked ? { $pull: { likes: user.id } } : { $addToSet: { likes: user.id } });

  revalidatePath('/forum');
  revalidatePath(`/forum/${postId}`);
  return { ok: true };
}

export async function addReply(postId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(postId).success) return { ok: false, error: 'Publication introuvable' };
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const result = await Post.updateOne(
    { _id: postId },
    { $push: { replies: { author: user.id, content: parsed.data.content, createdAt: new Date() } } },
  );
  if (result.matchedCount === 0) return { ok: false, error: 'Publication introuvable' };

  revalidatePath(`/forum/${postId}`);
  revalidatePath('/forum');
  return { ok: true };
}

export async function deleteReply(postId: string, replyId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(postId).success || !objectId.safeParse(replyId).success) {
    return { ok: false, error: 'Réponse introuvable' };
  }

  await connectDB();
  const post = await Post.findById(postId);
  const reply = post?.replies.id(replyId);
  if (!post || !reply) return { ok: false, error: 'Réponse introuvable' };
  if (reply.author.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };

  reply.deleteOne();
  await post.save();
  revalidatePath(`/forum/${postId}`);
  revalidatePath('/forum');
  return { ok: true };
}

/** Admin : supprime une publication depuis la liste d'administration (sans redirection) */
export async function adminDeletePost(postId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(postId).success) return { ok: false, error: 'Publication introuvable' };

  await connectDB();
  await Post.findByIdAndDelete(postId);
  revalidatePath('/forum');
  revalidatePath('/admin/forum');
  revalidatePath('/');
  return { ok: true };
}
