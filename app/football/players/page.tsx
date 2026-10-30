import Link from 'next/link';
import { listAllClubs, PLAYERS_PER_PAGE, POSITION_LABELS, searchPlayersPage } from '@/lib/queries/football';
import { formatEUR } from '@/lib/utils';
import FootballTabs from '@/components/football/FootballTabs';
import Avatar from '@/components/football/Avatar';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

export const metadata = { title: 'Joueurs' };

type SearchParams = Promise<{ q?: string; position?: string; club?: string; page?: string }>;

export default async function PlayersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, position, club, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ players, total }, clubs] = await Promise.all([
    searchPlayersPage({ q: q?.trim() || undefined, position: position || undefined, club: Number(club) || undefined, page }),
    listAllClubs(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FootballTabs active="players" />
      <h1 className="page-title">Joueurs</h1>

      {/* Formulaire GET : les filtres sont dans l'URL */}
      <form className="grid gap-2 card sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Input name="q" defaultValue={q} placeholder="Nom du joueur (ex. Mbappé)" />
        </div>
        <Select name="position" defaultValue={position ?? ''}>
          <option value="">Tous les postes</option>
          {Object.entries(POSITION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="club" defaultValue={club ?? ''}>
          <option value="">Tous les clubs</option>
          {clubs.map((c) => (
            <option key={c.tmId} value={c.tmId}>
              {c.name}
            </option>
          ))}
        </Select>
        <button className="btn btn-primary sm:col-span-4">Rechercher</button>
      </form>

      <p className="text-sm text-slate-400">{total} joueur(s)</p>

      {players.length === 0 ? (
        <EmptyState message="Aucun joueur ne correspond à cette recherche." />
      ) : (
        <ul className="divide-y divide-white/5 card p-0">
          {players.map((p) => (
            <li key={p.tmId}>
              <Link href={`/football/players/${p.tmId}`} className="flex items-center gap-3 p-3 hover:bg-white/5">
                <Avatar src={p.imageUrl} name={p.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {POSITION_LABELS[p.position]} · {p.clubName ?? 'Sans club'}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-amber-400">{formatEUR(p.marketValueEur)}</p>
                  <p className="text-xs text-slate-400">
                    {p.totals.goals} buts · {p.totals.assists} passes
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / PLAYERS_PER_PAGE)} params={{ q, position, club }} basePath="/football/players" />
    </div>
  );
}
