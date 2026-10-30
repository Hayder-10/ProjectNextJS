import Link from 'next/link';
import { listCities, listPitches } from '@/lib/queries/booking';
import { PITCH_TYPES } from '@/lib/validation/booking';
import { formatTND } from '@/lib/utils';
import PlayTabs from '@/components/booking/PlayTabs';
import PitchImage from '@/components/booking/PitchImage';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = { title: 'Terrains' };

export default async function PitchesPage({ searchParams }: { searchParams: Promise<{ city?: string; type?: string }> }) {
  const { city, type } = await searchParams;
  const [pitches, cities] = await Promise.all([listPitches({ city, type }), listCities()]);

  return (
    <div className="space-y-4">
      <PlayTabs active="pitches" />
      <div className="flex items-center justify-between">
        <h1 className="page-title">Terrains</h1>
        <Link href="/bookings" className="link text-sm">
          Mes réservations →
        </Link>
      </div>

      <form className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Select name="city" defaultValue={city ?? ''}>
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select name="type" defaultValue={type ?? ''}>
          <option value="">Tous les types</option>
          {PITCH_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <button className="btn btn-primary col-span-2 sm:col-span-1">Filtrer</button>
      </form>

      {pitches.length === 0 ? (
        <EmptyState message="Aucun terrain disponible." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pitches.map((p) => (
            <Link key={p._id} href={`/pitches/${p._id}`} className="overflow-hidden card p-0 card-hover">
              <PitchImage pitch={p} className="h-36" />
              <div className="space-y-1 p-4">
                <h2 className="font-bold">{p.name}</h2>
                <p className="text-sm text-slate-400">📍 {p.city}</p>
                <div className="flex justify-between text-sm">
                  <span>
                    {p.type} · {p.openHour}h–{p.closeHour}h
                  </span>
                  <span className="font-bold text-amber-400">{formatTND(p.pricePerHour)}/h</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
