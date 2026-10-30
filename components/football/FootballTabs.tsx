import Tabs from '@/components/ui/Tabs';

const TABS = { competitions: '/football', players: '/football/players', myxi: '/my-xi' };

/** Onglets en haut des pages Football : Compétitions | Joueurs | Mon XI */
export default function FootballTabs({ active }: { active: keyof typeof TABS }) {
  return (
    <Tabs
      active={TABS[active]}
      tabs={[
        { href: TABS.competitions, label: 'Compétitions' },
        { href: TABS.players, label: 'Joueurs' },
        { href: TABS.myxi, label: 'Mon XI' },
      ]}
    />
  );
}
