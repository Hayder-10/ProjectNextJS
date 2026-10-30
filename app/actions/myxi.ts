'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { FORMATIONS, myTeamSchema, type Position } from '@/lib/validation/myxi';
import { firstError, objectId } from '@/lib/validation/common';
import { flattenPlayer, PLAYER_FIELDS, type PickedPlayer } from '@/lib/queries/myxi';
import { escapeRegex, type ActionResult } from '@/lib/utils';
import MyTeam from '@/models/MyTeam';
import Player from '@/models/Player';

const POSITION_LABELS: Record<Position, string> = { GK: 'gardien(s)', DEF: 'défenseur(s)', MID: 'milieu(x)', FWD: 'attaquant(s)' };

/** Lecture : 20 joueurs au plus pour le sélecteur du composeur */
export async function searchPlayers(query: string, position: Position): Promise<PickedPlayer[]> {
  if (!['GK', 'DEF', 'MID', 'FWD'].includes(position)) return [];
  await connectDB();
  const filter: Record<string, unknown> = { position };
  const q = String(query ?? '').trim().slice(0, 50);
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

  const players = await Player.find(filter).select(PLAYER_FIELDS).sort({ marketValueEur: -1 }).limit(20).lean();
  return players.map(flattenPlayer);
}

/** Lit et valide le formulaire du composeur, puis vérifie les postes selon la formation */
async function parseTeamForm(formData: FormData) {
  const parsed = myTeamSchema.safeParse({
    name: formData.get('name'),
    formation: formData.get('formation'),
    isPublic: formData.get('isPublic') === 'on',
    players: formData.getAll('players').filter((v) => v !== ''),
  });
  if (!parsed.success) return { error: firstError(parsed.error) } as const;

  const players = await Player.find({ _id: { $in: parsed.data.players } }).select('position').lean();
  if (players.length !== 11) return { error: 'Certains joueurs sont introuvables' } as const;

  const expected = FORMATIONS[parsed.data.formation];
  for (const pos of Object.keys(expected) as Position[]) {
    const count = players.filter((p) => p.position === pos).length;
    if (count !== expected[pos]) {
      return { error: `La formation ${parsed.data.formation} demande ${expected[pos]} ${POSITION_LABELS[pos]} (vous en avez ${count})` } as const;
    }
  }
  return { data: parsed.data } as const;
}

export async function createMyTeam(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  await connectDB();
  const result = await parseTeamForm(formData);
  if ('error' in result) return { ok: false, error: result.error! };

  await MyTeam.create({ ...result.data, owner: user.id });
  revalidatePath('/my-xi');
  redirect('/my-xi');
}

export async function updateMyTeam(teamId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(teamId).success) return { ok: false, error: 'XI introuvable' };
  await connectDB();

  const team = await MyTeam.findById(teamId);
  if (!team) return { ok: false, error: 'XI introuvable' };
  if (team.owner.toString() !== user.id) return { ok: false, error: 'Action non autorisée' };

  const result = await parseTeamForm(formData);
  if ('error' in result) return { ok: false, error: result.error! };

  team.set(result.data);
  await team.save();
  revalidatePath('/my-xi');
  redirect('/my-xi');
}

export async function deleteMyTeam(teamId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(teamId).success) return { ok: false, error: 'XI introuvable' };
  await connectDB();

  const team = await MyTeam.findById(teamId);
  if (!team) return { ok: false, error: 'XI introuvable' };
  if (team.owner.toString() !== user.id) return { ok: false, error: 'Action non autorisée' };

  await team.deleteOne();
  revalidatePath('/my-xi');
  return { ok: true };
}

/** Admin : modération, supprime le XI de n'importe quel utilisateur */
export async function adminDeleteMyTeam(teamId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(teamId).success) return { ok: false, error: 'XI introuvable' };

  await connectDB();
  await MyTeam.findByIdAndDelete(teamId);
  revalidatePath('/my-xi');
  revalidatePath('/admin/teams');
  return { ok: true };
}
