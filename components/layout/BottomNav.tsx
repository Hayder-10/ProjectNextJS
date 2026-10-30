'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { navLinks, isActive } from './nav-links';

/** Barre d'onglets fixe en bas (mobile uniquement) */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {navLinks.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${active ? 'text-green-400' : 'text-slate-400'}`}>
                <Icon name={link.icon} className={`h-6 w-6 transition ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.7)]' : ''}`} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
