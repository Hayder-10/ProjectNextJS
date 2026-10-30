import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { isFutureSlot, listMyBookings, type BookingItem } from '@/lib/queries/booking';
import { BOOKING_DAYS_AHEAD } from '@/lib/validation/booking';
import { formatDate, formatTND, toDateString, todayString } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import MoveBookingForm from '@/components/booking/MoveBookingForm';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Mes réservations' };

export default async function BookingsPage() {
  const user = await requireUser();
  const bookings = await listMyBookings(user.id);

  const upcoming = bookings
    .filter((b) => b.status === 'active' && isFutureSlot(b.date, b.startHour))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
  const past = bookings.filter((b) => !upcoming.includes(b));

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + BOOKING_DAYS_AHEAD);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Mes réservations</h1>

      <h2 className="section-title">À venir</h2>
      {upcoming.length === 0 ? (
        <EmptyState message="Aucune réservation à venir." actionLabel="Réserver un terrain" actionHref="/pitches" />
      ) : (
        upcoming.map((b) => (
          <BookingCard key={b._id} booking={b}>
            <div className="flex flex-wrap items-start gap-2">
              {b.pitch && (
                <MoveBookingForm
                  bookingId={b._id}
                  date={b.date}
                  startHour={b.startHour}
                  openHour={b.pitch.openHour}
                  closeHour={b.pitch.closeHour}
                  minDate={todayString()}
                  maxDate={toDateString(maxDate)}
                />
              )}
              <ConfirmDeleteButton action="cancelBooking" args={[b._id]} label="Annuler" confirmMessage="Annuler cette réservation ?" />
            </div>
          </BookingCard>
        ))
      )}

      <h2 className="section-title">Passées et annulées</h2>
      {past.length === 0 ? (
        <p className="text-slate-400">Rien pour le moment.</p>
      ) : (
        past.map((b) => <BookingCard key={b._id} booking={b} />)
      )}
    </div>
  );
}

function BookingCard({ booking, children }: { booking: BookingItem; children?: React.ReactNode }) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {booking.pitch ? (
          <Link href={`/pitches/${booking.pitch._id}`} className="font-bold hover:underline">
            {booking.pitch.name}
          </Link>
        ) : (
          <span className="font-bold">Terrain supprimé</span>
        )}
        {booking.status === 'cancelled' ? <Badge color="red">Annulée</Badge> : <Badge color="green">Active</Badge>}
      </div>
      <p className="text-sm">
        <Icon name="calendar" /> {formatDate(booking.date)} · <Icon name="clock" /> {booking.startHour}h–{booking.startHour + 1}h ·{' '}
        <span className="font-semibold text-amber-400">{formatTND(booking.price)}</span>
      </p>
      {children}
    </Card>
  );
}
