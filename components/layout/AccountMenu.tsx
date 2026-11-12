'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Icon, { type IconName } from '@/components/ui/Icon';

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/profile', label: 'Profil', icon: 'user' },
  { href: '/bookings', label: 'Mes réservations', icon: 'calendar' },
  { href: '/shop/orders', label: 'Mes commandes', icon: 'package' },
  { href: '/seller', label: 'Ma boutique', icon: 'cash' },
  { href: '/teams', label: 'Mes équipes', icon: 'users' },
  { href: '/tournaments?tab=mine', label: 'Mes tournois', icon: 'trophy' },
  { href: '/my-xi', label: 'Mon XI', icon: 'shirt' },
];

/** Menu du compte : se ferme au clic extérieur, avec Échap et après avoir choisi un lien */
export default function AccountMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const links = isAdmin ? [...LINKS, { href: '/admin', label: 'Administration', icon: 'shield' as const }] : LINKS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu du compte"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-emerald-700 font-bold ring-2 ring-white/10"
      >
        {name[0]?.toUpperCase()}
      </button>
      {open && (
        <div className="surface absolute right-0 mt-2 w-60 overflow-hidden">
          <p className="truncate border-b border-white/10 px-4 py-3 text-sm font-semibold">{name}</p>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
              <Icon name={link.icon} className="h-4 w-4 text-slate-400" />
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5"
          >
            <Icon name="logout" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
