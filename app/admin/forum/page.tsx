import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listPostsForAdmin } from '@/lib/queries/admin';
import { CATEGORY_LABELS } from '@/lib/validation/forum';
import { formatDate } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Admin · Forum' };

export default async function AdminForumPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const posts = await listPostsForAdmin(q?.trim());

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/forum" />
      <h1 className="page-title">Forum</h1>
      <p className="text-sm text-slate-400">Pour modérer une réponse, ouvrez la publication : l&apos;admin peut supprimer n&apos;importe quelle réponse.</p>

      <form className="flex gap-2">
        <div className="flex-1">
          <Input name="q" defaultValue={q} placeholder="Rechercher par titre" />
        </div>
        <button className="btn btn-secondary">Rechercher</button>
      </form>

      {posts.length === 0 ? (
        <EmptyState message="Aucune publication." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Auteur</th>
                <th>Catégorie</th>
                <th aria-label="J’aime"><Icon name="heart" /></th>
                <th aria-label="Réponses"><Icon name="chat" /></th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p._id}>
                  <td className="max-w-xs">
                    <Link href={`/forum/${p._id}`} className="line-clamp-2 font-medium text-white hover:underline">{p.title}</Link>
                  </td>
                  <td>{p.author?.name ?? 'Compte supprimé'}</td>
                  <td><Badge color="green">{CATEGORY_LABELS[p.category]}</Badge></td>
                  <td>{p.likesCount}</td>
                  <td>{p.repliesCount}</td>
                  <td className="whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/forum/${p._id}/edit`} className="btn btn-secondary btn-sm">Modifier</Link>
                      <ConfirmDeleteButton action="adminDeletePost" args={[p._id]} confirmMessage={`Supprimer « ${p.title} » ?`} className="btn-sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
