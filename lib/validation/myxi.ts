import { z } from 'zod';

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export const FORMATION_NAMES = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '4-5-1',
  '4-1-4-1',
  '4-4-1-1',
  '4-3-2-1',
  '4-1-2-1-2',
  '3-5-2',
  '3-4-3',
  '3-4-2-1',
  '5-3-2',
  '5-4-1',
] as const;

export type Formation = (typeof FORMATION_NAMES)[number];

// Dans le nom d'une formation, la première ligne est la défense, la dernière l'attaque, le reste le milieu
function formationParts(formation: Formation) {
  return formation.split('-').map(Number);
}

function countByPosition(formation: Formation): Record<Position, number> {
  const parts = formationParts(formation);
  return { GK: 1, DEF: parts[0], MID: parts.slice(1, -1).reduce((sum, n) => sum + n, 0), FWD: parts[parts.length - 1] };
}

// Nombre de joueurs par poste pour chaque formation
export const FORMATIONS = Object.fromEntries(FORMATION_NAMES.map((f) => [f, countByPosition(f)])) as Record<Formation, Record<Position, number>>;

/**
 * Lignes du terrain, de la défense vers l'attaque. Un poste peut occuper plusieurs lignes
 * (4-2-3-1 : deux lignes de milieux) : start est l'indice du premier joueur du poste sur cette ligne.
 */
export function formationLines(formation: Formation) {
  const parts = formationParts(formation);
  const lines: { position: Position; start: number; count: number }[] = [{ position: 'GK', start: 0, count: 1 }];
  let midStart = 0;
  parts.forEach((count, i) => {
    if (i === 0) lines.push({ position: 'DEF', start: 0, count });
    else if (i === parts.length - 1) lines.push({ position: 'FWD', start: 0, count });
    else {
      lines.push({ position: 'MID', start: midStart, count });
      midStart += count;
    }
  });
  return lines;
}

export const myTeamSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir 2 à 80 caractères').max(80, 'Le nom doit contenir 2 à 80 caractères'),
  formation: z.enum(FORMATION_NAMES, 'Formation invalide'),
  isPublic: z.boolean(),
  players: z
    .array(z.string().regex(/^[a-f0-9]{24}$/, 'Joueur invalide'))
    .length(11, 'Choisissez exactement 11 joueurs')
    .refine((ids) => new Set(ids).size === 11, 'Un joueur ne peut apparaître qu\'une fois'),
});
