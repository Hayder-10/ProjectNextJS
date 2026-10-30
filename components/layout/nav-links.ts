// Onglets partagés par la barre du bas (mobile) et le menu du header (ordinateur)
export const navLinks = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/forum', label: 'Forum', icon: '💬' },
  { href: '/football', label: 'Football', icon: '⚽' },
  { href: '/shop', label: 'Boutique', icon: '🛒' },
  { href: '/pitches', label: 'Jouer', icon: '🥅' },
];

// Les onglets Mon XI et Tournois sont rattachés à Football et Jouer
export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/football') return pathname.startsWith('/football') || pathname.startsWith('/my-xi');
  if (href === '/pitches') return pathname.startsWith('/pitches') || pathname.startsWith('/tournaments');
  return pathname.startsWith(href);
}
