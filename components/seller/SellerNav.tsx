import Link from 'next/link';

const LINKS = [
  { href: '/seller', label: 'Tableau de bord' },
  { href: '/seller/products', label: 'Produits' },
  { href: '/seller/orders', label: 'Ventes' },
];

/** Pages du vendeur, une fois la boutique ouverte */
export default function SellerNav({ active }: { active: string }) {
  return (
    <nav aria-label="Ma boutique" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={active === l.href ? 'page' : undefined} className={`chip ${active === l.href ? 'chip-active' : ''}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
