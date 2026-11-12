'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser, type SessionUser } from '@/lib/auth';
import { registerTeamSchema, scoreSchema, tournamentSchema } from '@/lib/validation/tournaments';
import { firstError, objectId } from '@/lib/validation/common';
import { todayString, type ActionResult } from '@/lib/utils';
import {
  firstKnockoutRound,
  generateGroupMatches,
  groupByRound,
  groupRanking,
  isKnockout,
  isMatchLocked,
  nextKnockoutRound,
  nextStep,
  qualifiedCount,
  type TournamentMatch,
} from '@/lib/tournament-format';
import Team from '@/models/Team';
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

  if (tournament.status !== 'open' && parsed.data.maxTeams !== tournament.maxTeams) {
    return { ok: false, error: "Le nombre d'équipes ne peut plus changer : le tournoi a commencé" };
  }
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
  const parsed = registerTeamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const team = await Team.findOne({ _id: parsed.data.teamId, owner: user.id });
  if (!team) return { ok: false, error: 'Équipe introuvable' };
  const name: string = team.name;

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

  tournament.teams.push({ name, captain: user.id, players: team.players });
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

/** Démarre le tournoi : chaque équipe reçoit 3 adversaires tirés au sort */
export async function startTournament(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;

  if (tournament.status !== 'open') return { ok: false, error: 'Le tournoi a déjà commencé' };
  if (tournament.teams.length !== tournament.maxTeams) {
    return { ok: false, error: `Il faut ${tournament.maxTeams} équipes pour démarrer (${tournament.teams.length} inscrites)` };
  }

  const teams: string[] = tournament.teams.map((t: TeamDoc) => t.name);
  tournament.set({ status: 'ongoing', matches: generateGroupMatches(teams) });
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
  if (isMatchLocked(match, tournament.matches)) return { ok: false, error: 'Le tour suivant a commencé : ce score ne peut plus changer' };
  if (isKnockout(match) && parsed.data.homeScore === parsed.data.awayScore) {
    return { ok: false, error: 'Un match à élimination doit avoir un vainqueur : indiquez le score avec les tirs au but' };
  }

  match.set(parsed.data);
  await tournament.save();
  revalidateTournament(id);
  return { ok: true, message: 'Score enregistré' };
}

/** Crée le tour suivant : les éliminatoires à partir du classement, ou le tour des vainqueurs */
export async function advanceTournament(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;
  if (tournament.status !== 'ongoing') return { ok: false, error: "Le tournoi n'est pas en cours" };

  const matches = tournament.matches as TournamentMatch[];
  const teams: string[] = tournament.teams.map((t: TeamDoc) => t.name);
  const step = nextStep(matches, teams);

  if (step.type === 'knockout') {
    const ranking = groupRanking(matches, teams).slice(0, qualifiedCount(teams.length));
    tournament.matches.push(...firstKnockoutRound(ranking));
  } else if (step.type === 'next-round') {
    const lastRound = groupByRound(matches.filter(isKnockout)).at(-1)!.matches;
    tournament.matches.push(...nextKnockoutRound(lastRound));
  } else {
    return { ok: false, error: 'Saisissez tous les scores avant de passer au tour suivant' };
  }

  await tournament.save();
  revalidateTournament(id);
  return { ok: true };
}

export async function finishTournament(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await loadAsOrganizer(id, user);
  if ('error' in result) return { ok: false, error: result.error! };
  const { tournament } = result;

  if (tournament.status !== 'ongoing') return { ok: false, error: 'Seul un tournoi en cours peut être clôturé' };

  const step = nextStep(tournament.matches as TournamentMatch[], tournament.teams.map((t: TeamDoc) => t.name));
  if (step.type !== 'finish') return { ok: false, error: 'Tous les matchs doivent être joués avant de clôturer le tournoi' };

  tournament.set({ status: 'finished', champion: step.champion });
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
