import { requireAdmin } from '@/lib/auth';
import { listPlayerTeamsForAdmin } from '@/lib/queries/admin';
import { formatDate } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Admin · Équipes' };

export default async function AdminPlayerTeamsPage() {
  await requireAdmin();
  const teams = await listPlayerTeamsForAdmin();

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/player-teams" />
      <h1 className="page-title">Équipes des utilisateurs</h1>
      <p className="text-sm text-slate-400">
        Modération : l&apos;admin peut supprimer une équipe au nom inapproprié. Pour la retirer d&apos;un tournoi ouvert, passez par la page du tournoi.
      </p>

      {teams.length === 0 ? (
        <EmptyState message="Aucune équipe créée." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Équipe</th>
                <th>Propriétaire</th>
                <th>Joueurs</th>
                <th>Modifiée le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t._id}>
                  <td className="font-medium text-white">{t.name}</td>
                  <td>{t.owner?.name ?? 'Compte supprimé'}</td>
                  <td className="max-w-xs truncate" title={t.players.join(', ')}>{t.players.join(', ')}</td>
                  <td className="whitespace-nowrap">{formatDate(t.updatedAt)}</td>
                  <td>
                    <ConfirmDeleteButton action="adminDeleteTeam" args={[t._id]} confirmMessage={`Supprimer l'équipe « ${t.name} » ?`} className="btn-sm" />
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
