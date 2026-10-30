import Link from 'next/link';
import { listPosts, POSTS_PER_PAGE } from '@/lib/queries/forum';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/validation/forum';
import PostCard from '@/components/forum/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

export const metadata = { title: 'Forum' };

type SearchParams = Promise<{ category?: string; author?: string; page?: string }>;

export default async function ForumPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, author, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { posts, total } = await listPosts({ category, author, page });

  const tabClass = (active: boolean) =>
    `chip ${active ? 'chip-active' : ''}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Forum</h1>
        <Link href="/forum/new" className="btn btn-primary">
          + Publier
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/forum" className={tabClass(!category)}>
          Tout
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/forum?category=${c}`} className={tabClass(category === c)}>
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {author && (
        <p className="text-sm text-slate-400">
          Publications d&apos;un seul auteur · <Link href="/forum" className="text-green-400 underline">voir tout</Link>
        </p>
      )}

      {posts.length === 0 ? (
        <EmptyState message="Aucune publication pour le moment." actionLabel="Écrire la première" actionHref="/forum/new" />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / POSTS_PER_PAGE)} params={{ category, author }} basePath="/forum" />
    </div>
  );
}
