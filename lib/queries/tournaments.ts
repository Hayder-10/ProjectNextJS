import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { toPlain } from '@/lib/utils';
import Tournament from '@/models/Tournament';
import '@/models/User';
import '@/models/Pitch';

type UserRef = { _id: string; name: string } | null;

export type TournamentItem = {
  _id: string;
  organizer: UserRef;
  name: string;
  description?: string;
  city: string;
  pitch: { _id: string; name: string; city: string } | null;
  startDate: string;
  maxTeams: 4 | 8 | 16;
  status: 'open' | 'ongoing' | 'finished';
  teams: { _id: string; name: string; captain: UserRef }[];
  matches: { _id: string; homeTeam: string; awayTeam: string; homeScore?: number; awayScore?: number; round: string }[];
  createdAt: string;
};

export async function listTournaments({ status, userId }: { status?: string; userId?: string }) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  // « Mes tournois » : ceux que j'organise ou où j'ai inscrit une équipe
  if (userId) filter.$or = [{ organizer: userId }, { 'teams.captain': userId }];

  const tournaments = await Tournament.find(filter)
    .sort({ startDate: status === 'finished' ? -1 : 1 })
    .select('-matches')
    .populate('organizer', 'name')
    .populate('pitch', 'name city')
    .lean();
  return toPlain<TournamentItem[]>(tournaments);
}

export async function getOpenTournaments(limit = 3) {
  const tournaments = await listTournaments({ status: 'open' });
  return tournaments.slice(0, limit);
}

export async function getTournament(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const tournament = await Tournament.findById(id)
    .populate('organizer', 'name')
    .populate('pitch', 'name city')
    .populate('teams.captain', 'name')
    .lean();
  return tournament ? toPlain<TournamentItem>(tournament) : null;
}
