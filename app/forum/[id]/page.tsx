import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getPost } from '@/lib/queries/forum';
import { CATEGORY_LABELS } from '@/lib/validation/forum';
import { formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import LikeButton from '@/components/forum/LikeButton';
import ReplyForm from '@/components/forum/ReplyForm';
import Icon from '@/components/ui/Icon';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, user] = await Promise.all([getPost(id), getCurrentUser()]);
  if (!post) notFound();

  const canEdit = !!user && (user.id === post.author?._id || user.role === 'admin');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/forum" className="link text-sm">
        <Icon name="arrow-left" /> Forum
      </Link>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge color="green">{CATEGORY_LABELS[post.category]}</Badge>
          <span className="text-xs text-slate-400">
            {post.author?.name ?? 'Compte supprimé'} · {formatDate(post.createdAt)}
          </span>
        </div>
        <h1 className="page-title">{post.title}</h1>
        <p className="whitespace-pre-line text-slate-200">{post.content}</p>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <LikeButton postId={post._id} liked={!!user && post.likes.includes(user.id)} count={post.likes.length} loggedIn={!!user} />
          {canEdit && (
            <>
              <Link href={`/forum/${post._id}/edit`} className="btn btn-secondary">
                Modifier
              </Link>
              <ConfirmDeleteButton action="deletePost" args={[post._id]} confirmMessage="Supprimer cette publication ?" />
            </>
          )}
        </div>
      </Card>

      <h2 className="section-title">Réponses ({post.replies.length})</h2>

      {post.replies.length === 0 && <p className="text-slate-400">Aucune réponse pour le moment.</p>}

      <div className="space-y-3">
        {post.replies.map((reply) => (
          <Card key={reply._id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{reply.author?.name ?? 'Compte supprimé'}</span>
              <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
            </div>
            <p className="whitespace-pre-line">{reply.content}</p>
            {user && (user.id === reply.author?._id || user.role === 'admin') && (
              <div className="mt-2">
                <ConfirmDeleteButton
                  action="deleteReply" args={[post._id, reply._id]}
                  confirmMessage="Supprimer cette réponse ?"
                  className="min-h-9 px-3 py-1 text-sm"
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {user ? (
        <Card>
          <ReplyForm postId={post._id} />
        </Card>
      ) : (
        <p className="text-center text-slate-400">
          <Link href={`/login?callbackUrl=/forum/${post._id}`} className="link">
            Connectez-vous
          </Link>{' '}
          pour répondre.
        </p>
      )}
    </div>
  );
}
