import { requireAdmin } from '@/lib/auth';
import { listTeamsForAdmin } from '@/lib/queries/admin';
import { formatDate } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Admin · Mes XI' };

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await listTeamsForAdmin();

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/teams" />
      <h1 className="page-title">XI des utilisateurs</h1>
      <p className="text-sm text-slate-400">Modération : l&apos;admin peut supprimer un XI au nom inapproprié. Seul son propriétaire peut le modifier.</p>

      {teams.length === 0 ? (
        <EmptyState message="Aucun XI composé." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nom du XI</th>
                <th>Propriétaire</th>
                <th>Formation</th>
                <th>Visibilité</th>
                <th>Modifié le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t._id}>
                  <td className="font-medium text-white">{t.name}</td>
                  <td>{t.owner?.name ?? 'Compte supprimé'}</td>
                  <td><Badge color="green">{t.formation}</Badge></td>
                  <td>{t.isPublic ? <Badge>Public</Badge> : <Badge color="amber">Privé</Badge>}</td>
                  <td className="whitespace-nowrap">{formatDate(t.updatedAt)}</td>
                  <td>
                    <ConfirmDeleteButton action="adminDeleteMyTeam" args={[t._id]} confirmMessage={`Supprimer le XI « ${t.name} » ?`} className="btn-sm" />
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
