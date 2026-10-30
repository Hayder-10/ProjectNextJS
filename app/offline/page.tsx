import RetryButton from './retry-button';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Hors ligne' };

// Page statique mise en cache par le service worker
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md card p-8 text-center">
      <Icon name="wifi-off" className="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <h1 className="mb-2 text-xl font-bold">Vous êtes hors ligne</h1>
      <p className="mb-4 text-slate-400">Cette page n&apos;a pas encore été visitée. Vérifiez votre connexion.</p>
      <RetryButton />
    </div>
  );
}
