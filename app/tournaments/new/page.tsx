import { requireUser } from '@/lib/auth';
import { listPitches } from '@/lib/queries/booking';
import { todayString } from '@/lib/utils';
import Card from '@/components/ui/Card';
import TournamentForm from '@/components/tournaments/TournamentForm';

export const metadata = { title: 'Nouveau tournoi' };

export default async function NewTournamentPage() {
  await requireUser();
  const pitches = await listPitches();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Organiser un tournoi</h1>
      <Card>
        <TournamentForm pitches={pitches} minDate={todayString()} />
      </Card>
    </div>
  );
}
