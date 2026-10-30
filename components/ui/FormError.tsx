import type { ActionResult } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

/** Affiche le message d'erreur (ou de succès) renvoyé par une Server Action */
export default function FormError({ state }: { state: ActionResult }) {
  if (!state) return null;
  if (state.ok) {
    return state.message ? (
      <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300"><Icon name="check" /> {state.message}</p>
    ) : null;
  }
  return <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>;
}
