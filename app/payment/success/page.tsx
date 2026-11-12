import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { confirmPayment } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Paiement' };

/** Page de retour de Stripe : confirme le paiement si le webhook n'est pas encore passé */
export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const user = await requireUser();
  if (!sessionId) notFound();

  const session = await getStripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || session.metadata?.userId !== user.id) notFound();

  await confirmPayment(session);

  const isBooking = session.metadata?.kind === 'booking';
  const paid = session.payment_status === 'paid';

  return (
    <div className="mx-auto max-w-xl">
      <Card className="space-y-3 text-center">
        <Icon name={paid ? 'check' : 'clock'} className={`mx-auto h-10 w-10 ${paid ? 'text-green-400' : 'text-amber-400'}`} />
        <h1 className="page-title">{paid ? 'Paiement réussi' : 'Paiement en cours'}</h1>
        <p className="text-slate-300">
          {paid
            ? `Votre ${isBooking ? 'réservation' : 'commande'} est confirmée. Un e-mail de confirmation vous a été envoyé.`
            : 'Stripe n\'a pas encore confirmé votre paiement. Le statut sera mis à jour dès sa réception.'}
        </p>
        <Link href={isBooking ? '/bookings' : '/shop/orders'} className="btn btn-primary">
          {isBooking ? 'Voir mes réservations' : 'Voir mes commandes'}
        </Link>
      </Card>
    </div>
  );
}
