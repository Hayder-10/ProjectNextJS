import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listTournaments } from '@/lib/queries/tournaments';
import { TOURNAMENT_STATUS_LABELS } from '@/lib/validation/tournaments';
import { formatDate } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Admin · Tournois' };

const STATUS_COLORS = { open: 'green', ongoing: 'amber', finished: 'slate' } as const;

export default async function AdminTournamentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const tournaments = await listTournaments({ status: status || undefined });

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/tournaments" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Tournois</h1>
        <Link href="/tournaments/new" className="btn btn-primary">+ Nouveau tournoi</Link>
      </div>
      <p className="text-sm text-slate-400">
        L&apos;admin a les mêmes droits que l&apos;organisateur : ouvrez un tournoi pour retirer une équipe, le démarrer, saisir les scores ou le clôturer.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/tournaments" className={`chip ${!status ? 'chip-active' : ''}`}>Tous</Link>
        {(['open', 'ongoing', 'finished'] as const).map((s) => (
          <Link key={s} href={`/admin/tournaments?status=${s}`} className={`chip ${status === s ? 'chip-active' : ''}`}>
            {TOURNAMENT_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState message="Aucun tournoi." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Tournoi</th>
                <th>Organisateur</th>
                <th>Ville</th>
                <th>Début</th>
                <th>Équipes</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t._id}>
                  <td>
                    <Link href={`/tournaments/${t._id}`} className="font-medium text-white hover:underline">{t.name}</Link>
                  </td>
                  <td>{t.organizer?.name ?? 'Compte supprimé'}</td>
                  <td>{t.city}</td>
                  <td className="whitespace-nowrap">{formatDate(t.startDate)}</td>
                  <td>{t.teams.length}/{t.maxTeams}</td>
                  <td><Badge color={STATUS_COLORS[t.status]}>{TOURNAMENT_STATUS_LABELS[t.status]}</Badge></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/tournaments/${t._id}/edit`} className="btn btn-secondary btn-sm">Modifier</Link>
                      <ConfirmDeleteButton action="adminDeleteTournament" args={[t._id]} confirmMessage={`Supprimer « ${t.name} » ?`} className="btn-sm" />
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
