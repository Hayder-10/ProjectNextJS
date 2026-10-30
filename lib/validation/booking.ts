import { z } from 'zod';
import { optionalUrl } from './common';

export const PITCH_TYPES = ['5v5', '7v7', '11v11'] as const;

export const MAX_FUTURE_BOOKINGS = 3;
export const BOOKING_DAYS_AHEAD = 14;

export const pitchSchema = z
  .object({
    name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Nom trop long'),
    city: z.string().trim().min(2, 'Ville obligatoire').max(60, 'Ville trop longue'),
    address: z.string().trim().min(5, 'Adresse trop courte').max(200, 'Adresse trop longue'),
    type: z.enum(PITCH_TYPES, 'Type de terrain invalide'),
    pricePerHour: z.coerce.number('Prix invalide').positive('Le prix doit être supérieur à 0'),
    openHour: z.coerce.number().int().min(0, "L'heure d'ouverture doit être entre 0 et 23").max(23, "L'heure d'ouverture doit être entre 0 et 23"),
    closeHour: z.coerce.number().int().min(1, "L'heure de fermeture doit être entre 1 et 24").max(24, "L'heure de fermeture doit être entre 1 et 24"),
    imageUrl: optionalUrl,
    isActive: z.boolean(),
  })
  .refine((p) => p.closeHour > p.openHour, { message: "L'heure de fermeture doit être après l'heure d'ouverture", path: ['closeHour'] });

export const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  startHour: z.coerce.number().int('Heure invalide').min(0, 'Heure invalide').max(23, 'Heure invalide'),
});
