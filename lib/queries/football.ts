import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/db';
import { toPlain } from '@/lib/utils';
import { computeStandings } from '@/lib/standings';
import Competition from '@/models/Competition';
import Club from '@/models/Club';
import Player from '@/models/Player';
import Game from '@/models/Game';

export type CompetitionItem = { _id: string; tmId: string; name: string; type: string; country?: string };
export type ClubItem = { _id: string; tmId: number; name: string; competitionTmId: string; stadium?: string; logoUrl?: string };
export type Stats = { appearances: number; goals: number; assists: number; minutes: number; yellowCards: number; redCards: number };
export type PlayerItem = {
  _id: string;
  tmId: number;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  subPosition?: string;
  nationality?: string;
  birthDate?: string;
  clubTmId?: number;
  clubName?: string;
  marketValueEur?: number;
  imageUrl?: string;
  totals: Stats;
  seasons: (Stats & { season: number; competitionTmId: string })[];
};
export type GameItem = {
  _id: string;
  tmId: number;
  competitionTmId: string;
  season: number;
  round?: string;
  date: string;
  homeClubTmId: number;
  homeClubName: string;
  homeGoals: number;
  awayClubTmId: number;
  awayClubName: string;
  awayGoals: number;
  stadium?: string;
};

export const POSITION_LABELS = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', FWD: 'Attaquant' } as const;

// Les données football ne changent qu'à l'import : les lectures lourdes sont mises en cache 1 heure.
// unstable_cache ajoute automatiquement les arguments de la fonction à la clé du cache.
const CACHE = { revalidate: 3600, tags: ['football'] };

export const listCompetitions = unstable_cache(
  async () => {
    await connectDB();
    const competitions = await Competition.find().sort({ type: -1, name: 1 }).lean();
    return toPlain<CompetitionItem[]>(competitions);
  },
  ['listCompetitions'],
  CACHE,
);

export const getCompetition = unstable_cache(
  async (tmId: string) => {
    await connectDB();
    const competition = await Competition.findOne({ tmId }).lean();
    return competition ? toPlain<CompetitionItem>(competition) : null;
  },
  ['getCompetition'],
  CACHE,
);

/** Saisons disponibles pour une compétition, la plus récente d'abord */
export const getCompetitionSeasons = unstable_cache(
  async (tmId: string) => {
    await connectDB();
    const seasons: number[] = await Game.distinct('season', { competitionTmId: tmId });
    return seasons.sort((a, b) => b - a);
  },
  ['getCompetitionSeasons'],
  CACHE,
);

export const getCompetitionStandings = unstable_cache(
  async (tmId: string, season: number) => {
    await connectDB();
    const games = await Game.find({ competitionTmId: tmId, season }).select('homeClubName awayClubName homeGoals awayGoals').lean();
    return computeStandings(
      games.map((g) => ({ home: g.homeClubName ?? '?', away: g.awayClubName ?? '?', homeGoals: g.homeGoals, awayGoals: g.awayGoals })),
    );
  },
  ['getCompetitionStandings'],
  CACHE,
);

export const listClubsOfCompetition = unstable_cache(
  async (tmId: string) => {
    await connectDB();
    const clubs = await Club.find({ competitionTmId: tmId }).sort({ name: 1 }).lean();
    return toPlain<ClubItem[]>(clubs);
  },
  ['listClubsOfCompetition'],
  CACHE,
);

/** Clubs groupés par championnat, pour le <select> du club favori */
export const getClubsGroupedByCompetition = unstable_cache(
  async () => {
    await connectDB();
    const [competitions, clubs] = await Promise.all([
      Competition.find({ type: 'domestic_league' }).sort({ name: 1 }).lean(),
      Club.find().sort({ name: 1 }).select('name competitionTmId').lean(),
    ]);
    return competitions.map((c) => ({
      competition: c.name as string,
      clubs: toPlain<{ _id: string; name: string }[]>(clubs.filter((club) => club.competitionTmId === c.tmId)),
    }));
  },
  ['getClubsGroupedByCompetition'],
  CACHE,
);

export const listAllClubs = unstable_cache(
  async () => {
    await connectDB();
    const clubs = await Club.find().sort({ name: 1 }).select('tmId name').lean();
    return toPlain<{ _id: string; tmId: number; name: string }[]>(clubs);
  },
  ['listAllClubs'],
  CACHE,
);

/** Noms des compétitions par tmId, pour afficher les tableaux de stats */
export const getCompetitionNames = unstable_cache(
  async () => {
    await connectDB();
    const competitions = await Competition.find().select('tmId name').lean();
    return Object.fromEntries(competitions.map((c) => [c.tmId as string, c.name as string]));
  },
  ['getCompetitionNames'],
  CACHE,
);

/** Chiffres affichés sur la page d'accueil */
export const getFootballStats = unstable_cache(
  async () => {
    await connectDB();
    const [competitions, clubs, players, games] = await Promise.all([
      Competition.estimatedDocumentCount(),
      Club.estimatedDocumentCount(),
      Player.estimatedDocumentCount(),
      Game.estimatedDocumentCount(),
    ]);
    return { competitions, clubs, players, games };
  },
  ['getFootballStats'],
  CACHE,
);

export async function getClubByTmId(tmId: number) {
  await connectDB();
  const club = await Club.findOne({ tmId }).lean();
  return club ? toPlain<ClubItem>(club) : null;
}

export async function getClubById(id: string) {
  await connectDB();
  const club = await Club.findById(id).lean();
  return club ? toPlain<ClubItem>(club) : null;
}

export async function getSquad(clubTmId: number) {
  await connectDB();
  const players = await Player.find({ clubTmId }).select('-seasons').sort({ marketValueEur: -1 }).lean();
  return toPlain<PlayerItem[]>(players);
}

export async function getClubLastGames(clubTmId: number, limit = 10) {
  await connectDB();
  const games = await Game.find({ $or: [{ homeClubTmId: clubTmId }, { awayClubTmId: clubTmId }] })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return toPlain<GameItem[]>(games);
}

export async function getCompetitionLastGames(tmId: string, limit = 3) {
  await connectDB();
  const games = await Game.find({ competitionTmId: tmId }).sort({ date: -1 }).limit(limit).lean();
  return toPlain<GameItem[]>(games);
}

export const PLAYERS_PER_PAGE = 20;

export async function searchPlayersPage({ q, position, club, page }: { q?: string; position?: string; club?: number; page: number }) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q) filter.$text = { $search: q };
  if (position) filter.position = position;
  if (club) filter.clubTmId = club;

  const [players, total] = await Promise.all([
    Player.find(filter)
      .select('-seasons')
      .sort({ marketValueEur: -1 })
      .skip((page - 1) * PLAYERS_PER_PAGE)
      .limit(PLAYERS_PER_PAGE)
      .lean(),
    Player.countDocuments(filter),
  ]);
  return { players: toPlain<PlayerItem[]>(players), total };
}

export async function getPlayerByTmId(tmId: number) {
  await connectDB();
  const player = await Player.findOne({ tmId }).lean();
  return player ? toPlain<PlayerItem>(player) : null;
}
