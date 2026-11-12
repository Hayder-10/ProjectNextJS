'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { firstError, objectId } from '@/lib/validation/common';
import { parsePlayerNames, teamFormSchema } from '@/lib/validation/teams';
import type { ActionResult } from '@/lib/utils';
import Team from '@/models/Team';

function parseTeamForm(formData: FormData) {
  return teamFormSchema.safeParse({
    name: formData.get('name'),
    players: parsePlayerNames(String(formData.get('players') ?? '')),
  });
}

/** Après la création, revient au tournoi depuis lequel l'équipe a été créée */
export async function createTeam(tournamentId: string | undefined, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseTeamForm(formData);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  await Team.create({ ...parsed.data, owner: user.id });
  revalidatePath('/teams');
  redirect(tournamentId && objectId.safeParse(tournamentId).success ? `/tournaments/${tournamentId}` : '/teams');
}

export async function updateTeam(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Équipe introuvable' };
  const parsed = parseTeamForm(formData);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const team = await Team.findById(id);
  if (!team) return { ok: false, error: 'Équipe introuvable' };
  if (team.owner.toString() !== user.id) return { ok: false, error: 'Action non autorisée' };

  team.set(parsed.data);
  await team.save();
  revalidatePath('/teams');
  redirect('/teams');
}

export async function deleteTeam(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Équipe introuvable' };

  await connectDB();
  const team = await Team.findById(id);
  if (!team) return { ok: false, error: 'Équipe introuvable' };
  if (team.owner.toString() !== user.id) return { ok: false, error: 'Action non autorisée' };

  await team.deleteOne();
  revalidatePath('/teams');
  return { ok: true };
}

/** Admin : modération, supprime l'équipe de n'importe quel utilisateur */
export async function adminDeleteTeam(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Équipe introuvable' };

  await connectDB();
  await Team.findByIdAndDelete(id);
  revalidatePath('/teams');
  revalidatePath('/admin/player-teams');
  return { ok: true };
}
