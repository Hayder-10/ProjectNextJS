'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import Icon from '@/components/ui/Icon';
import AccountMenu from './AccountMenu';
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
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
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
            <AccountMenu name={session.user.name ?? ''} isAdmin={session.user.role === 'admin'} />
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
