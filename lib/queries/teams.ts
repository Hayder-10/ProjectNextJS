import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { toPlain } from '@/lib/utils';
import Team from '@/models/Team';

export type TeamItem = { _id: string; owner: string; name: string; players: string[]; updatedAt: string };

export async function listTeams(ownerId: string) {
  await connectDB();
  const teams = await Team.find({ owner: ownerId }).sort({ updatedAt: -1 }).lean();
  return toPlain<TeamItem[]>(teams);
}

export async function getTeam(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const team = await Team.findById(id).lean();
  return team ? toPlain<TeamItem>(team) : null;
}
