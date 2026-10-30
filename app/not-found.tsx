import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md card p-8 text-center">
      <p className="mb-2 text-4xl">🚩</p>
      <h1 className="mb-2 text-xl font-bold">Page introuvable</h1>
      <p className="mb-4 text-slate-400">Hors-jeu ! Cette page n&apos;existe pas.</p>
      <Link href="/" className="btn btn-primary">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
