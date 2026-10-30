'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser, type SessionUser } from '@/lib/auth';
import { scoreSchema, teamSchema, tournamentSchema } from '@/lib/validation/tournaments';
import { firstError, objectId } from '@/lib/validation/common';
import { todayString, type ActionResult } from '@/lib/utils';
import Tournament from '@/models/Tournament';

type TeamDoc = { name: string; captain: { toString(): string } };

function revalidateTournament(id?: string) {
  revalidatePath('/tournaments');
  revalidatePath('/');
  if (id) revalidatePath(`/tournaments/${id}`);
}

/** Charge le tournoi et vérifie que l'utilisateur en est l'organisateur (ou admin) */
async function loadAsOrganizer(id: string, user: SessionUser) {
  if (!objectId.safeParse(id).success) return { error: 'Tournoi introuvable' } as const;
  await connectDB();
  const tournament = await Tournament.findById(id);
  if (!tournament) return { error: 'Tournoi introuvable' } as const;
  if (tournament.organizer.toString() !== user.id && user.role !== 'admin') return { error: 'Action réservée à l\'organisateur' } as const;
  return { tournament } as const;
}

export async function createTournament(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (parsed.data.startDate < todayString()) return { ok: false, error: 'La date de début ne peut pas être dans le passé' };

  await connectDB();
  const tournament = await Tournament.create({
    ...parsed.data,
    description: parsed.data.description || undefined,
    pitch: parsed.data.pitch || undefined,
    organizer: user.id,
  });
  revalidateTournament();
  redirect(`/tournaments/${tournament._id}`);
}

export async function updateTournament(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;

  if (parsed.data.maxTeams < tournament.teams.length) {
    return { ok: false, error: `${tournament.teams.length} équipes sont déjà inscrites : impossible de descendre à ${parsed.data.maxTeams}` };
  }
  if (parsed.data.startDate !== tournament.startDate && parsed.data.startDate < todayString()) {
    return { ok: false, error: 'La date de début ne peut pas être dans le passé' };
  }

  tournament.set({
    ...parsed.data,
    description: parsed.data.description || undefined,
    pitch: parsed.data.pitch || undefined,
  });
  await tournament.save();
  revalidateTournament(id);
  redirect(`/tournaments/${id}`);
}

export async function deleteTournament(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };

  await result.tournament.deleteOne();
  revalidateTournament();
  redirect('/tournaments');
}

export async function registerTeam(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Tournoi introuvable' };
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const name = parsed.data.name;

  await connectDB();
  const tournament = await Tournament.findById(id);
  if (!tournament) return { ok: false, error: 'Tournoi introuvable' };
  if (tournament.status !== 'open') return { ok: false, error: 'Les inscriptions sont fermées' };
  if (tournament.teams.length >= tournament.maxTeams) return { ok: false, error: 'Le tournoi est complet' };
  if (tournament.teams.some((t: TeamDoc) => t.captain.toString() === user.id)) {
    return { ok: false, error: 'Vous avez déjà inscrit une équipe à ce tournoi' };
  }
  if (tournament.teams.some((t: TeamDoc) => t.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: 'Ce nom d\'équipe est déjà pris dans ce tournoi' };
  }

  tournament.teams.push({ name, captain: user.id });
  await tournament.save();
  revalidateTournament(id);
  return { ok: true, message: 'Équipe inscrite !' };
}

export async function withdrawTeam(id: string, teamId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success || !objectId.safeParse(teamId).success) return { ok: false, error: 'Équipe introuvable' };

  await connectDB();
  const tournament = await Tournament.findById(id);
  const team = tournament?.teams.id(teamId);
  if (!tournament || !team) return { ok: false, error: 'Équipe introuvable' };

  const allowed = team.captain.toString() === user.id || tournament.organizer.toString() === user.id || user.role === 'admin';
  if (!allowed) return { ok: false, error: 'Action non autorisée' };
  if (tournament.status !== 'open') return { ok: false, error: 'Le tournoi a déjà commencé' };

  team.deleteOne();
  await tournament.save();
  revalidateTournament(id);
  return { ok: true };
}

/** Démarre le tournoi : championnat aller simple, chaque équipe rencontre chaque autre une fois */
export async function startTournament(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;

  if (tournament.status !== 'open') return { ok: false, error: 'Le tournoi a déjà commencé' };
  if (tournament.teams.length < 4) return { ok: false, error: 'Il faut au moins 4 équipes pour démarrer' };

  const teams: string[] = tournament.teams.map((t: TeamDoc) => t.name);
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ homeTeam: teams[i], awayTeam: teams[j], round: 'Groupe' });
    }
  }

  tournament.set({ status: 'ongoing', matches });
  await tournament.save();
  revalidateTournament(id);
  return { ok: true };
}

export async function setMatchScore(id: string, matchId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(matchId).success) return { ok: false, error: 'Match introuvable' };
  const parsed = scoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;

  if (tournament.status !== 'ongoing') return { ok: false, error: 'Les scores se saisissent pendant le tournoi' };
  const match = tournament.matches.id(matchId);
  if (!match) return { ok: false, error: 'Match introuvable' };

  match.homeScore = parsed.data.homeScore;
  match.awayScore = parsed.data.awayScore;
  await tournament.save();
  revalidateTournament(id);
  return { ok: true, message: 'Score enregistré' };
}

export async function finishTournament(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;

  if (tournament.status !== 'ongoing') return { ok: false, error: 'Seul un tournoi en cours peut être clôturé' };
  tournament.status = 'finished';
  await tournament.save();
  revalidateTournament(id);
  return { ok: true };
}

/** Admin : supprime un tournoi depuis la liste d'administration (sans redirection) */
export async function adminDeleteTournament(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Tournoi introuvable' };

  await connectDB();
  await Tournament.findByIdAndDelete(id);
  revalidateTournament();
  revalidatePath('/admin/tournaments');
  return { ok: true };
}
