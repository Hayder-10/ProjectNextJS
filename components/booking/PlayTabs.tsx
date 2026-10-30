import Tabs from '@/components/ui/Tabs';

/** Onglets en haut de l'espace « Jouer » : Terrains | Tournois */
export default function PlayTabs({ active }: { active: 'pitches' | 'tournaments' }) {
  return (
    <Tabs
      active={active === 'pitches' ? '/pitches' : '/tournaments'}
      tabs={[
        { href: '/pitches', label: 'Terrains' },
        { href: '/tournaments', label: 'Tournois' },
      ]}
    />
  );
}
