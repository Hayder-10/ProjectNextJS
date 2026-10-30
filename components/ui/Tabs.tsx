import Link from 'next/link';
import Icon, { type IconName } from '@/components/ui/Icon';

type Tab = { href: string; label: string; icon?: IconName };

/** Barre d'onglets (Football, Jouer, Administration…) */
export default function Tabs({ tabs, active }: { tabs: Tab[]; active: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl md:flex-wrap md:overflow-visible border border-white/10 bg-slate-900/80 p-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition ${
            active === t.href ? 'bg-green-500 text-slate-950 shadow-lg shadow-green-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          {t.icon && <Icon name={t.icon} />}
          {t.label}
        </Link>
      ))}
    </div>
  );
}
