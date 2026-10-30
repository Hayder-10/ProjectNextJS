import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listTournaments } from '@/lib/queries/tournaments';
import PlayTabs from '@/components/booking/PlayTabs';
import TournamentCard from '@/components/tournaments/TournamentCard';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = { title: 'Tournois' };

const TABS = [
  { key: 'open', label: 'Ouverts' },
  { key: 'ongoing', label: 'En cours' },
  { key: 'finished', label: 'Terminés' },
];

export default async function TournamentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'open' } = await searchParams;
  const user = await getCurrentUser();

  const tournaments =
    tab === 'mine' && user ? await listTournaments({ userId: user.id }) : await listTournaments({ status: TABS.some((t) => t.key === tab) ? tab : 'open' });

  const tabs = user ? [...TABS, { key: 'mine', label: 'Mes tournois' }] : TABS;
  const tabClass = (active: boolean) =>
    `chip ${active ? 'chip-active' : ''}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PlayTabs active="tournaments" />
      <div className="flex items-center justify-between">
        <h1 className="page-title">Tournois</h1>
        <Link href="/tournaments/new" className="btn btn-primary">
          + Créer
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link key={t.key} href={`/tournaments?tab=${t.key}`} className={tabClass(tab === t.key)}>
            {t.label}
          </Link>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState message="Aucun tournoi dans cette catégorie." actionLabel="Organiser un tournoi" actionHref="/tournaments/new" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tournaments.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
