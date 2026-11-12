'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';
import { activeSection, activeSubLink } from './nav-links';

/** Sous-menu de la section courante (Football, Jouer, Boutique), présent sur toutes ses pages */
export default function SectionNav() {
  const pathname = usePathname();
  const section = activeSection(pathname);
  const ref = useRef<HTMLDivElement>(null);

  // Sur mobile, la barre défile : on garde l'onglet actif visible
  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [pathname]);

  if (!section) return null;

  return (
    <div ref={ref} className="sticky top-[4.5rem] z-30 mb-4 [&>nav]:bg-slate-900 [&>nav]:shadow-lg [&>nav]:shadow-black/30">
      <Tabs tabs={section} active={activeSubLink(pathname, section)} label="Sous-menu de la section" />
    </div>
  );
}
