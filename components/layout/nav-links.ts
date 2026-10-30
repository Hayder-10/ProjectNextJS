import type { IconName } from '@/components/ui/Icon';

// Onglets partagés par la barre du bas (mobile) et le menu du header (ordinateur)
export const navLinks: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Accueil', icon: 'home' },
  { href: '/forum', label: 'Forum', icon: 'chat' },
  { href: '/football', label: 'Football', icon: 'ball' },
  { href: '/shop', label: 'Boutique', icon: 'cart' },
  { href: '/pitches', label: 'Jouer', icon: 'goal' },
];

// Les onglets Mon XI et Tournois sont rattachés à Football et Jouer
export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/football') return pathname.startsWith('/football') || pathname.startsWith('/my-xi');
  if (href === '/pitches') return pathname.startsWith('/pitches') || pathname.startsWith('/tournaments');
  return pathname.startsWith(href);
}
