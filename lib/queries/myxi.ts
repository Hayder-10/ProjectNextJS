import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { toPlain } from '@/lib/utils';
import MyTeam from '@/models/MyTeam';
import '@/models/Player';

/** Infos d'un joueur utiles au composeur et aux cartes de XI */
export type PickedPlayer = {
  _id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  clubName?: string;
  imageUrl?: string;
  marketValueEur?: number;
  goals: number;
  assists: number;
};

export type MyTeamItem = {
  _id: string;
  owner: string;
  name: string;
  formation: '4-3-3' | '4-4-2' | '3-5-2';
  isPublic: boolean;
  players: PickedPlayer[];
  updatedAt: string;
};

export const PLAYER_FIELDS = 'name position clubName imageUrl marketValueEur totals.goals totals.assists';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenPlayer(p: any): PickedPlayer {
  return {
    _id: String(p._id),
    name: p.name,
    position: p.position,
    clubName: p.clubName,
    imageUrl: p.imageUrl,
    marketValueEur: p.marketValueEur,
    goals: p.totals?.goals ?? 0,
    assists: p.totals?.assists ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTeamItem(team: any): MyTeamItem {
  return toPlain<MyTeamItem>({ ...team, players: team.players.filter(Boolean).map(flattenPlayer) });
}

export async function listMyTeams(ownerId: string) {
  await connectDB();
  const teams = await MyTeam.find({ owner: ownerId }).sort({ updatedAt: -1 }).populate('players', PLAYER_FIELDS).lean();
  return teams.map(toTeamItem);
}

export async function getMyTeam(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const team = await MyTeam.findById(id).populate('players', PLAYER_FIELDS).lean();
  return team ? toTeamItem(team) : null;
}
