import Icon from '@/components/ui/Icon';

type Props = {
  /** Faux si Stripe n'est pas configuré : seul le paiement hors ligne est proposé */
  onlineEnabled: boolean;
  /** Libellé du paiement hors ligne : « Sur place » ou « À la livraison » */
  cashLabel: string;
  cashHint: string;
};

/** Choix du mode de paiement, envoyé avec le formulaire dans le champ paymentMethod */
export default function PaymentMethodPicker({ onlineEnabled, cashLabel, cashHint }: Props) {
  const optionClass =
    'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 has-checked:border-green-500 has-checked:bg-green-500/10 has-focus-visible:ring-2 has-focus-visible:ring-green-500/50';

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-slate-200">Mode de paiement</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {onlineEnabled && (
          <label className={optionClass}>
            <input type="radio" name="paymentMethod" value="online" defaultChecked className="mt-1 h-4 w-4 accent-green-500" />
            <span>
              <span className="block font-semibold"><Icon name="card" /> En ligne</span>
              <span className="block text-xs text-slate-400">Carte bancaire, paiement sécurisé par Stripe</span>
            </span>
          </label>
        )}
        <label className={optionClass}>
          <input type="radio" name="paymentMethod" value="cash" defaultChecked={!onlineEnabled} className="mt-1 h-4 w-4 accent-green-500" />
          <span>
            <span className="block font-semibold"><Icon name="cash" /> {cashLabel}</span>
            <span className="block text-xs text-slate-400">{cashHint}</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
