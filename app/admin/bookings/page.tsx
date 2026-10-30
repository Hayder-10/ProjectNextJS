import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { isFutureSlot, listAllBookings } from '@/lib/queries/booking';
import { formatDate, formatTND } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Admin · Réservations' };

const FILTERS = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'past', label: 'Passées' },
  { key: 'cancelled', label: 'Annulées' },
  { key: 'all', label: 'Toutes' },
];

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireAdmin();
  const { filter = 'upcoming' } = await searchParams;
  const all = await listAllBookings();

  const bookings = all.filter((b) => {
    const future = b.status === 'active' && isFutureSlot(b.date, b.startHour);
    if (filter === 'upcoming') return future;
    if (filter === 'past') return b.status === 'active' && !future;
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });
  // Les réservations à venir sont triées de la plus proche à la plus lointaine
  if (filter === 'upcoming') bookings.sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/bookings" />
      <h1 className="page-title">Réservations</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/admin/bookings?filter=${f.key}`} className={`chip ${filter === f.key ? 'chip-active' : ''}`}>
            {f.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState message="Aucune réservation." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Créneau</th>
                <th>Terrain</th>
                <th>Utilisateur</th>
                <th>Prix</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const future = b.status === 'active' && isFutureSlot(b.date, b.startHour);
                return (
                  <tr key={b._id}>
                    <td className="whitespace-nowrap">{formatDate(b.date)}</td>
                    <td className="whitespace-nowrap">{b.startHour}h–{b.startHour + 1}h</td>
                    <td>{b.pitch?.name ?? '—'}</td>
                    <td>{typeof b.user === 'object' && b.user ? b.user.name : 'Compte supprimé'}</td>
                    <td className="whitespace-nowrap text-amber-400">{formatTND(b.price)}</td>
                    <td>
                      {b.status === 'cancelled' ? <Badge color="red">Annulée</Badge> : future ? <Badge color="green">À venir</Badge> : <Badge>Passée</Badge>}
                    </td>
                    <td>
                      {future && (
                        <ConfirmDeleteButton action="cancelBooking" args={[b._id]} label="Annuler" confirmMessage="Annuler cette réservation ?" className="btn-sm" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
