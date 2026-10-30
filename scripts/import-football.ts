// Importe les CSV de transfermarkt-datasets (data/raw/) dans MongoDB.
// Lancer avec : npm run import:football
// Le script vide d'abord les collections football : on peut le relancer sans créer de doublons.

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { parse } from 'csv-parse';
import Competition from '../models/Competition';
import Club from '../models/Club';
import Player from '../models/Player';
import Game from '../models/Game';

// Compétitions importées (une équipe peut modifier cette liste)
const KEEP = ['GB1', 'ES1', 'IT1', 'L1', 'FR1', 'CL', 'EL'];

const RAW_DIR = path.join(process.cwd(), 'data', 'raw');
const BATCH_SIZE = 1000;

type Row = Record<string, string>;
type Stats = { appearances: number; goals: number; assists: number; minutes: number; yellowCards: number; redCards: number };

const POSITIONS: Record<string, string> = { Goalkeeper: 'GK', Defender: 'DEF', Midfield: 'MID', Attack: 'FWD' };

// Colonnes attendues dans chaque fichier : le script s'arrête si l'une manque
const REQUIRED_COLUMNS: Record<string, string[]> = {
  'competitions.csv': ['competition_id', 'name', 'type', 'country_name'],
  'clubs.csv': ['club_id', 'name', 'domestic_competition_id', 'stadium_name'],
  'players.csv': [
    'player_id', 'name', 'position', 'sub_position', 'country_of_citizenship', 'date_of_birth',
    'current_club_id', 'current_club_name', 'market_value_in_eur', 'image_url',
  ],
  'games.csv': [
    'game_id', 'competition_id', 'season', 'round', 'date', 'home_club_id', 'away_club_id',
    'home_club_goals', 'away_club_goals', 'home_club_name', 'away_club_name', 'stadium',
  ],
  'appearances.csv': ['player_id', 'game_id', 'competition_id', 'date', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'],
};

/** Lit un CSV ligne par ligne (en flux, sans tout charger en mémoire) */
async function* readCsv(file: string): AsyncGenerator<Row> {
  const filePath = path.join(RAW_DIR, file);
  if (!fs.existsSync(filePath)) throw new Error(`Fichier manquant : ${filePath}`);

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: (header: string[]) => {
        const missing = REQUIRED_COLUMNS[file].filter((c) => !header.includes(c));
        if (missing.length) throw new Error(`${file} : colonnes manquantes ${missing.join(', ')}. Colonnes trouvées : ${header.join(', ')}`);
        return header;
      },
    }),
  );
  for await (const row of parser) yield row as Row;
}

const num = (v: string | undefined) => (v === undefined || v === '' ? undefined : Number(v));
const int = (v: string | undefined) => (v === undefined || v === '' ? 0 : parseInt(v, 10) || 0);
const str = (v: string | undefined) => (v ? v : undefined);
const date = (v: string | undefined) => (v ? new Date(v) : undefined);

const emptyStats = (): Stats => ({ appearances: 0, goals: 0, assists: 0, minutes: 0, yellowCards: 0, redCards: 0 });

/** Insère les documents par lots de 1 000 */
async function insertInBatches(model: mongoose.Model<any>, docs: AsyncIterable<object> | Iterable<object>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  let batch: object[] = [];
  let count = 0;
  for await (const doc of docs) {
    batch.push(doc);
    if (batch.length === BATCH_SIZE) {
      await model.insertMany(batch, { ordered: false });
      count += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await model.insertMany(batch, { ordered: false });
    count += batch.length;
  }
  return count;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquant (fichier .env.local)');
  await mongoose.connect(uri);
  console.log('Connecté à MongoDB');

  // 1. Vider les collections football
  await Promise.all([Competition.deleteMany({}), Club.deleteMany({}), Player.deleteMany({}), Game.deleteMany({})]);

  // 2. Compétitions de KEEP
  console.log('Import des compétitions…');
  await insertInBatches(
    Competition,
    (async function* () {
      for await (const r of readCsv('competitions.csv')) {
        if (!KEEP.includes(r.competition_id)) continue;
        yield { tmId: r.competition_id, name: formatName(r.name), type: r.type, country: str(r.country_name) };
      }
    })(),
  );

  // 3. Clubs dont le championnat est dans KEEP
  console.log('Import des clubs…');
  await insertInBatches(
    Club,
    (async function* () {
      for await (const r of readCsv('clubs.csv')) {
        if (!KEEP.includes(r.domestic_competition_id)) continue;
        yield {
          tmId: int(r.club_id),
          name: r.name,
          competitionTmId: r.domestic_competition_id,
          stadium: str(r.stadium_name),
          logoUrl: `https://tmssl.akamaized.net/images/wappen/head/${r.club_id}.png`,
        };
      }
    })(),
  );

  // 4. Matchs des compétitions de KEEP + Map game_id → saison
  console.log('Import des matchs…');
  const gameSeason = new Map<string, number>();
  await insertInBatches(
    Game,
    (async function* () {
      for await (const r of readCsv('games.csv')) {
        if (!KEEP.includes(r.competition_id)) continue;
        const season = int(r.season);
        gameSeason.set(r.game_id, season);
        yield {
          tmId: int(r.game_id),
          competitionTmId: r.competition_id,
          season,
          round: str(r.round),
          date: date(r.date),
          homeClubTmId: int(r.home_club_id),
          homeClubName: r.home_club_name || 'Inconnu',
          homeGoals: int(r.home_club_goals),
          awayClubTmId: int(r.away_club_id),
          awayClubName: r.away_club_name || 'Inconnu',
          awayGoals: int(r.away_club_goals),
          stadium: str(r.stadium),
        };
      }
    })(),
  );

  // 5. Statistiques : player_id → (saison|compétition) → stats
  console.log('Agrégation des apparitions (fichier volumineux, patience)…');
  const statsByPlayer = new Map<string, Map<string, Stats>>();
  let lines = 0;
  for await (const r of readCsv('appearances.csv')) {
    if (++lines % 200000 === 0) console.log(`  ${lines} lignes lues`);
    if (!KEEP.includes(r.competition_id)) continue;
    const season = gameSeason.get(r.game_id);
    if (season === undefined) continue;

    let seasons = statsByPlayer.get(r.player_id);
    if (!seasons) {
      seasons = new Map();
      statsByPlayer.set(r.player_id, seasons);
    }
    const key = `${season}|${r.competition_id}`;
    let s = seasons.get(key);
    if (!s) {
      s = emptyStats();
      seasons.set(key, s);
    }
    s.appearances++;
    s.goals += int(r.goals);
    s.assists += int(r.assists);
    s.minutes += int(r.minutes_played);
    s.yellowCards += int(r.yellow_cards);
    s.redCards += int(r.red_cards);
  }

  // 6. Joueurs présents dans la Map, avec totals et seasons
  console.log('Import des joueurs…');
  await insertInBatches(
    Player,
    (async function* () {
      for await (const r of readCsv('players.csv')) {
        const seasonsMap = statsByPlayer.get(r.player_id);
        const position = POSITIONS[r.position];
        if (!seasonsMap || !position) continue; // poste « Missing » ignoré

        const seasons = [...seasonsMap.entries()]
          .map(([key, s]) => {
            const [season, competitionTmId] = key.split('|');
            return { season: Number(season), competitionTmId, ...s };
          })
          .sort((a, b) => b.season - a.season);

        const totals = emptyStats();
        for (const s of seasons) {
          totals.appearances += s.appearances;
          totals.goals += s.goals;
          totals.assists += s.assists;
          totals.minutes += s.minutes;
          totals.yellowCards += s.yellowCards;
          totals.redCards += s.redCards;
        }

        yield {
          tmId: int(r.player_id),
          name: r.name,
          position,
          subPosition: str(r.sub_position),
          nationality: str(r.country_of_citizenship),
          birthDate: date(r.date_of_birth),
          clubTmId: num(r.current_club_id),
          clubName: str(r.current_club_name),
          marketValueEur: num(r.market_value_in_eur),
          imageUrl: str(r.image_url),
          totals,
          seasons,
        };
      }
    })(),
  );

  // 7. Index puis comptes
  await Promise.all([Competition.createIndexes(), Club.createIndexes(), Player.createIndexes(), Game.createIndexes()]);

  console.log('\nTerminé :');
  console.log(`  competitions : ${await Competition.countDocuments()}`);
  console.log(`  clubs        : ${await Club.countDocuments()}`);
  console.log(`  games        : ${await Game.countDocuments()}`);
  console.log(`  players      : ${await Player.countDocuments()}`);

  await mongoose.disconnect();
}

/** 'premier-league' → 'Premier League' (les noms de la source sont en minuscules avec tirets) */
function formatName(name: string) {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

main().catch(async (err) => {
  console.error('\nErreur :', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
