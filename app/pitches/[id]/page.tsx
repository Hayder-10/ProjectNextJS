import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getPitch, getTakenHours } from '@/lib/queries/booking';
import { BOOKING_DAYS_AHEAD } from '@/lib/validation/booking';
import { formatTND, toDateString, todayString } from '@/lib/utils';
import PitchImage from '@/components/booking/PitchImage';
import SlotPicker from '@/components/booking/SlotPicker';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';

/** Les 15 jours réservables : aujourd'hui + 14 jours */
function bookableDays() {
  return Array.from({ length: BOOKING_DAYS_AHEAD + 1 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: toDateString(d), label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) };
  });
}

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> };

export default async function PitchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const [pitch, user] = await Promise.all([getPitch(id), getCurrentUser()]);
  if (!pitch) notFound();

  const days = bookableDays();
  const date = days.some((d) => d.value === dateParam) ? dateParam! : todayString();
  const taken = await getTakenHours(pitch._id, date);

  // Heures passées d'aujourd'hui : désactivées
  const now = new Date();
  const pastLimit = date === todayString() ? now.getHours() : -1;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/pitches" className="link text-sm">
        <Icon name="arrow-left" /> Terrains
      </Link>

      <div className="overflow-hidden card p-0">
        <PitchImage pitch={pitch} className="h-48" />
        <div className="space-y-1 p-4">
          <div className="flex items-center gap-2">
            <h1 className="page-title">{pitch.name}</h1>
            {!pitch.isActive && <Badge color="red">Indisponible</Badge>}
          </div>
          <p className="text-slate-400">
            <Icon name="pin" /> {pitch.address}, {pitch.city}
          </p>
          <p>
            {pitch.type} · Ouvert de {pitch.openHour}h à {pitch.closeHour}h ·{' '}
            <span className="font-bold text-amber-400">{formatTND(pitch.pricePerHour)} / heure</span>
          </p>
        </div>
      </div>

      {pitch.isActive && (
        <Card className="space-y-4">
          <h2 className="section-title">Réserver un créneau</h2>

          {/* Choix de la date : paramètre ?date= lu par ce Server Component */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => (
              <Link
                key={d.value}
                href={`/pitches/${pitch._id}?date=${d.value}`}
                scroll={false}
                className={`chip ${d.value === date ? 'chip-active' : ''}`}
              >
                {d.label}
              </Link>
            ))}
          </div>

          {user ? (
            <SlotPicker
              key={date}
              pitchId={pitch._id}
              date={date}
              openHour={pitch.openHour}
              closeHour={pitch.closeHour}
              taken={taken}
              pastLimit={pastLimit}
              price={pitch.pricePerHour}
            />
          ) : (
            <p className="text-slate-400">
              <Link href={`/login?callbackUrl=/pitches/${pitch._id}`} className="link">
                Connectez-vous
              </Link>{' '}
              pour réserver.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
