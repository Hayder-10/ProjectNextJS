import RetryButton from './retry-button';

export const metadata = { title: 'Hors ligne' };

// Page statique mise en cache par le service worker
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md card p-8 text-center">
      <p className="mb-2 text-4xl">📡</p>
      <h1 className="mb-2 text-xl font-bold">Vous êtes hors ligne</h1>
      <p className="mb-4 text-slate-400">Cette page n&apos;a pas encore été visitée. Vérifiez votre connexion.</p>
      <RetryButton />
    </div>
  );
}
