import type { IconName } from '@/components/ui/Icon';

type NavLink = { href: string; label: string; icon: IconName };

// Onglets partagés par la barre du bas (mobile) et le menu du header (ordinateur)
export const navLinks: NavLink[] = [
  { href: '/', label: 'Accueil', icon: 'home' },
  { href: '/forum', label: 'Forum', icon: 'chat' },
  { href: '/football', label: 'Football', icon: 'ball' },
  { href: '/shop', label: 'Boutique', icon: 'cart' },
  { href: '/pitches', label: 'Jouer', icon: 'goal' },
];

// Sous-menus affichés sur toutes les pages d'une section. La clé est l'onglet principal.
const SECTIONS: Record<string, NavLink[]> = {
  '/football': [
    { href: '/football', label: 'Compétitions', icon: 'trophy' },
    { href: '/football/players', label: 'Joueurs', icon: 'users' },
    { href: '/my-xi', label: 'Mon XI', icon: 'shirt' },
  ],
  '/pitches': [
    { href: '/pitches', label: 'Terrains', icon: 'goal' },
    { href: '/bookings', label: 'Réservations', icon: 'calendar' },
    { href: '/tournaments', label: 'Tournois', icon: 'trophy' },
    { href: '/teams', label: 'Mes équipes', icon: 'users' },
  ],
  '/shop': [
    { href: '/shop', label: 'Produits', icon: 'bag' },
    { href: '/shop/boutiques', label: 'Boutiques', icon: 'pin' },
    { href: '/shop/cart', label: 'Panier', icon: 'cart' },
    { href: '/shop/orders', label: 'Commandes', icon: 'package' },
    { href: '/seller', label: 'Ma boutique', icon: 'cash' },
  ],
};

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return (SECTIONS[href] ?? [{ href }]).some((link) => matches(pathname, link.href));
}

export function activeSection(pathname: string) {
  const key = Object.keys(SECTIONS).find((href) => isActive(pathname, href));
  return key ? SECTIONS[key] : null;
}

/** Le lien le plus précis gagne : /football/players active « Joueurs », pas « Compétitions » */
export function activeSubLink(pathname: string, section: NavLink[]) {
  const candidates = section.filter((link) => matches(pathname, link.href));
  return candidates.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? '';
}
