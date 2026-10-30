import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getTournament } from '@/lib/queries/tournaments';
import { listPitches } from '@/lib/queries/booking';
import { todayString } from '@/lib/utils';
import Card from '@/components/ui/Card';
import TournamentForm from '@/components/tournaments/TournamentForm';

export const metadata = { title: 'Modifier le tournoi' };

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [tournament, pitches] = await Promise.all([getTournament(id), listPitches()]);
  if (!tournament) notFound();
  if (tournament.organizer?._id !== user.id && user.role !== 'admin') notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier « {tournament.name} »</h1>
      <Card>
        <TournamentForm id={tournament._id} pitches={pitches} tournament={tournament} minDate={todayString()} />
      </Card>
    </div>
  );
}
