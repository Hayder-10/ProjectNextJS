import { z } from 'zod';
import { optionalUrl } from './common';

export const PRODUCT_CATEGORIES = ['jerseys', 'boots', 'balls', 'training', 'accessories'] as const;

export const PRODUCT_CATEGORY_LABELS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  jerseys: 'Maillots',
  boots: 'Chaussures',
  balls: 'Ballons',
  training: 'Entraînement',
  accessories: 'Accessoires',
};

export const PRODUCT_CATEGORY_ICONS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  jerseys: '👕',
  boots: '👟',
  balls: '⚽',
  training: '🏃',
  accessories: '🧤',
};

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'cancelled'] as const;

export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  cancelled: 'Annulée',
};

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(120, 'Nom trop long'),
  description: z.string().trim().min(1, 'La description est obligatoire').max(2000, 'Description trop longue'),
  category: z.enum(PRODUCT_CATEGORIES, 'Catégorie invalide'),
  price: z.coerce.number('Prix invalide').positive('Le prix doit être supérieur à 0'),
  stock: z.coerce.number('Stock invalide').int('Le stock doit être un entier').min(0, 'Le stock ne peut pas être négatif'),
  imageUrl: optionalUrl,
});

export const orderSchema = z.object({
  shippingAddress: z.string().trim().min(5, 'Adresse de livraison trop courte').max(300, 'Adresse trop longue'),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,15}$/, 'Numéro de téléphone invalide'),
});

export const orderItemsSchema = z
  .array(
    z.object({
      productId: z.string().regex(/^[a-f0-9]{24}$/, 'Produit invalide'),
      quantity: z.number().int().min(1, 'Quantité invalide').max(99, 'Quantité trop grande'),
    }),
  )
  .min(1, 'Votre panier est vide');
