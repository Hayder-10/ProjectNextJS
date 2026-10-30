import Link from 'next/link';
import { listCompetitions } from '@/lib/queries/football';
import FootballTabs from '@/components/football/FootballTabs';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = { title: 'Football' };

// Lu dans MongoDB à chaque requête (pas de pré-rendu au build)
export const dynamic = 'force-dynamic';

export default async function FootballPage() {
  const competitions = await listCompetitions();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FootballTabs active="competitions" />
      <h1 className="page-title">Compétitions</h1>

      {competitions.length === 0 ? (
        <EmptyState message="Aucune donnée football. Lancez npm run import:football." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {competitions.map((c) => (
            <Link key={c.tmId} href={`/football/competitions/${c.tmId}`}>
              <Card className="flex h-full items-center gap-3 card-hover">
                <span className="text-3xl">{c.type === 'domestic_league' ? '🏆' : '⭐'}</span>
                <div>
                  <h2 className="font-bold">{c.name}</h2>
                  <div className="mt-1 flex gap-2">
                    <Badge>{c.country ?? 'Europe'}</Badge>
                    <Badge color="green">{c.type === 'domestic_league' ? 'Championnat' : 'Coupe'}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
