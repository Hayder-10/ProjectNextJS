import { z } from 'zod';

/** Champ URL facultatif : vide, ou commence par http(s):// */
export const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), "L'URL doit commencer par http:// ou https://");

export const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Identifiant invalide');

/** Message de la première erreur zod, à afficher dans le formulaire */
export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Données invalides';
}
