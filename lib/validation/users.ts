import { z } from 'zod';
import { optionalUrl } from './common';

const name = z.string().trim().min(2, 'Le nom doit contenir 2 à 50 caractères').max(50, 'Le nom doit contenir 2 à 50 caractères');
const password = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères');

export const registerSchema = z
  .object({
    name,
    email: z.string().trim().toLowerCase().email('E-mail invalide'),
    password,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] });

export const profileSchema = z.object({
  name,
  city: z.string().trim().max(60, 'Ville trop longue'),
  avatarUrl: optionalUrl,
  favoriteClub: z.string().refine((v) => v === '' || /^[a-f0-9]{24}$/.test(v), 'Club invalide'),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, 'Saisissez votre mot de passe actuel'),
    password,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] });
