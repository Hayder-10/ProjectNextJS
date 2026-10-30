'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md card p-8 text-center">
      <p className="mb-2 text-4xl">🟥</p>
      <h1 className="mb-2 text-xl font-bold">Une erreur est survenue</h1>
      {/* En production, Next masque le message réel des erreurs serveur */}
      <p className="mb-4 text-slate-400">
        {process.env.NODE_ENV === 'development' ? error.message : "Cette action n'a pas pu aboutir (accès refusé ou erreur serveur)."}
      </p>
      <button onClick={reset} className="btn btn-primary">
        Réessayer
      </button>
    </div>
  );
}
