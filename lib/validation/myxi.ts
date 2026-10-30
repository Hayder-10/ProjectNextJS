import { z } from 'zod';

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

// Nombre de joueurs par poste pour chaque formation
export const FORMATIONS = {
  '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
} as const;

export type Formation = keyof typeof FORMATIONS;

export const myTeamSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir 2 à 80 caractères').max(80, 'Le nom doit contenir 2 à 80 caractères'),
  formation: z.enum(['4-3-3', '4-4-2', '3-5-2'], 'Formation invalide'),
  isPublic: z.boolean(),
  players: z
    .array(z.string().regex(/^[a-f0-9]{24}$/, 'Joueur invalide'))
    .length(11, 'Choisissez exactement 11 joueurs')
    .refine((ids) => new Set(ids).size === 11, 'Un joueur ne peut apparaître qu\'une fois'),
});
