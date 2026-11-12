import { z } from 'zod';
import { optionalUrl } from './common';

export const SHOP_STATUS_LABELS = {
  pending: 'En attente de validation',
  approved: 'Ouverte',
  rejected: 'Refusée',
  suspended: 'Suspendue',
} as const;

export const SHOP_STATUS_COLORS = { pending: 'amber', approved: 'green', rejected: 'red', suspended: 'red' } as const;

export const shopSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir 2 à 60 caractères').max(60, 'Le nom doit contenir 2 à 60 caractères'),
  description: z.string().trim().min(10, 'Décrivez votre boutique en au moins 10 caractères').max(1000, 'Description trop longue'),
  city: z.string().trim().min(2, 'Ville obligatoire').max(60, 'Ville trop longue'),
  logoUrl: optionalUrl,
});

export const rejectShopSchema = z.object({
  reason: z.string().trim().min(3, 'Indiquez le motif du refus').max(300, 'Motif trop long'),
});
