import Icon from '@/components/ui/Icon';

/** Affiché au retour de Stripe quand le client a abandonné le paiement */
export default function PaymentCancelledNotice({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
      <Icon name="alert" /> Paiement non finalisé. Vous pouvez le reprendre ci-dessous pendant 30 minutes, sinon {what} sera annulée.
    </p>
  );
}
