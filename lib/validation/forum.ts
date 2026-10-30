import { z } from 'zod';

export const CATEGORIES = ['general', 'match-talk', 'transfers', 'tactics'] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  general: 'Général',
  'match-talk': 'Matchs',
  transfers: 'Transferts',
  tactics: 'Tactique',
};

export const postSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir 3 à 120 caractères').max(120, 'Le titre doit contenir 3 à 120 caractères'),
  content: z.string().trim().min(1, 'Le contenu est obligatoire').max(5000, 'Le contenu ne doit pas dépasser 5000 caractères'),
  category: z.enum(CATEGORIES, 'Catégorie invalide'),
});

export const replySchema = z.object({
  content: z.string().trim().min(1, 'La réponse est vide').max(5000, 'La réponse ne doit pas dépasser 5000 caractères'),
});
