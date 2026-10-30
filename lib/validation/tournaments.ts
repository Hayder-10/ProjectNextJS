import { z } from 'zod';

export const TOURNAMENT_STATUS_LABELS = { open: 'Inscriptions ouvertes', ongoing: 'En cours', finished: 'Terminé' } as const;

export const tournamentSchema = z.object({
  name: z.string().trim().min(3, 'Le nom doit contenir 3 à 80 caractères').max(80, 'Le nom doit contenir 3 à 80 caractères'),
  description: z.string().trim().max(1000, 'Description trop longue'),
  city: z.string().trim().min(2, 'Ville obligatoire').max(60, 'Ville trop longue'),
  pitch: z.string().refine((v) => v === '' || /^[a-f0-9]{24}$/.test(v), 'Terrain invalide'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de début invalide'),
  maxTeams: z.coerce.number().refine((n) => [4, 8, 16].includes(n), 'Le nombre d\'équipes doit être 4, 8 ou 16'),
});

export const teamSchema = z.object({
  name: z.string().trim().min(2, "Le nom d'équipe doit contenir 2 à 40 caractères").max(40, "Le nom d'équipe doit contenir 2 à 40 caractères"),
});

export const scoreSchema = z.object({
  homeScore: z.coerce.number('Score invalide').int('Le score doit être un entier').min(0, 'Le score ne peut pas être négatif').max(99, 'Score trop grand'),
  awayScore: z.coerce.number('Score invalide').int('Le score doit être un entier').min(0, 'Le score ne peut pas être négatif').max(99, 'Score trop grand'),
});
