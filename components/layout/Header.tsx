'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import Icon, { type IconName } from '@/components/ui/Icon';
import { navLinks, isActive } from './nav-links';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { count } = useCart();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="font-display text-2xl font-extrabold uppercase tracking-wide">
          <span className="bg-linear-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Foot</span>Hub
        </Link>

        {/* Menu horizontal sur ordinateur */}
        <nav className="hidden flex-1 gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(pathname, link.href) ? 'bg-green-500/15 text-green-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/shop/cart" className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10" aria-label="Panier">
            <Icon name="cart" className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-950 shadow-lg shadow-amber-400/40">
                {count}
              </span>
            )}
          </Link>

          {session ? (
            <details className="relative">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-linear-to-br from-green-500 to-emerald-700 font-bold ring-2 ring-white/10">
                {session.user.name?.[0]?.toUpperCase()}
              </summary>
              <div className="surface absolute right-0 mt-2 w-60 overflow-hidden">
                <p className="border-b border-white/10 px-4 py-3 text-sm font-semibold">{session.user.name}</p>
                <MenuLink href="/profile" icon="user">Profil</MenuLink>
                <MenuLink href="/bookings" icon="calendar">Mes réservations</MenuLink>
                <MenuLink href="/shop/orders" icon="package">Mes commandes</MenuLink>
                {session.user.role === 'admin' && <MenuLink href="/admin" icon="shield">Administration</MenuLink>}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5"
                >
                  <Icon name="logout" />
                  Déconnexion
                </button>
              </div>
            </details>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: IconName; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5"
    >
      <Icon name={icon} className="h-4 w-4 text-slate-400" />
      {children}
    </Link>
  );
}
