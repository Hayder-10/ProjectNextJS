import { z } from 'zod';

export const MIN_TEAM_PLAYERS = 5;
export const MAX_TEAM_PLAYERS = 25;

/** Le formulaire envoie un joueur par ligne */
export function parsePlayerNames(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export const teamFormSchema = z.object({
  name: z.string().trim().min(2, "Le nom d'équipe doit contenir 2 à 40 caractères").max(40, "Le nom d'équipe doit contenir 2 à 40 caractères"),
  players: z
    .array(z.string().min(2, 'Chaque nom de joueur doit contenir au moins 2 caractères').max(60, 'Nom de joueur trop long'))
    .min(MIN_TEAM_PLAYERS, `Ajoutez au moins ${MIN_TEAM_PLAYERS} joueurs`)
    .max(MAX_TEAM_PLAYERS, `Une équipe compte au plus ${MAX_TEAM_PLAYERS} joueurs`)
    .refine((names) => new Set(names.map((n) => n.toLowerCase())).size === names.length, 'Un joueur apparaît deux fois'),
});
