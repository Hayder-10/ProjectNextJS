import Link from 'next/link';
import type { PostListItem } from '@/lib/queries/forum';
import { CATEGORY_LABELS } from '@/lib/validation/forum';
import { formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function PostCard({ post }: { post: PostListItem }) {
  return (
    <Link href={`/forum/${post._id}`} className="block">
      <Card className="card-hover">
        <div className="mb-1 flex items-center gap-2">
          <Badge color="green">{CATEGORY_LABELS[post.category]}</Badge>
          <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
        </div>
        <h2 className="text-lg font-bold text-white">{post.title}</h2>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
          <span>par {post.author?.name ?? 'Compte supprimé'}</span>
          <span className="flex gap-3">
            <span>❤️ {post.likesCount}</span>
            <span>💬 {post.repliesCount}</span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
