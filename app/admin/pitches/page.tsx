import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listAllPitches } from '@/lib/queries/booking';
import { formatTND } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Badge from '@/components/ui/Badge';
import SavedBanner from '@/components/ui/SavedBanner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Admin · Terrains' };

export default async function AdminPitchesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const pitches = await listAllPitches();

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/pitches" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Terrains</h1>
        <div className="flex gap-2">
          <Link href="/admin/bookings" className="btn btn-secondary">Voir les réservations</Link>
          <Link href="/admin/pitches/new" className="btn btn-primary">+ Nouveau terrain</Link>
        </div>
      </div>
      <SavedBanner saved={saved} />

      {pitches.length === 0 ? (
        <EmptyState message="Aucun terrain." actionLabel="Créer un terrain" actionHref="/admin/pitches/new" />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Terrain</th>
                <th>Ville</th>
                <th>Type</th>
                <th>Horaires</th>
                <th>Prix/h</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pitches.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link href={`/pitches/${p._id}`} className="font-medium text-white hover:underline">{p.name}</Link>
                  </td>
                  <td>{p.city}</td>
                  <td>{p.type}</td>
                  <td className="whitespace-nowrap">{p.openHour}h–{p.closeHour}h</td>
                  <td className="whitespace-nowrap font-semibold text-amber-400">{formatTND(p.pricePerHour)}</td>
                  <td>{p.isActive ? <Badge color="green">Actif</Badge> : <Badge color="red">Inactif</Badge>}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/admin/pitches/${p._id}/edit`} className="btn btn-secondary btn-sm">Modifier</Link>
                      <ConfirmDeleteButton
                        action="deletePitch" args={[p._id]}
                        confirmMessage={`Supprimer « ${p.name} » ? S'il a des réservations, il sera seulement désactivé.`}
                        className="btn-sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
