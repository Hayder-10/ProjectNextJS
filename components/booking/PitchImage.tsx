import type { PitchItem } from '@/lib/queries/booking';
import Icon from '@/components/ui/Icon';

export default function PitchImage({ pitch, className = '' }: { pitch: Pick<PitchItem, 'name' | 'imageUrl' | 'type'>; className?: string }) {
  if (pitch.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={pitch.imageUrl} alt={pitch.name} className={`w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex w-full items-center justify-center gap-3 bg-linear-to-br from-green-700 via-emerald-900 to-slate-950 font-display text-4xl font-extrabold uppercase text-white/80 ${className}`}>
      <Icon name="goal" className="h-10 w-10" /> {pitch.type}
    </div>
  );
}
