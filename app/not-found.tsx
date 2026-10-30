import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md card p-8 text-center">
      <Icon name="flag" className="mx-auto mb-3 h-10 w-10 text-amber-400" />
      <h1 className="mb-2 text-xl font-bold">Page introuvable</h1>
      <p className="mb-4 text-slate-400">Hors-jeu ! Cette page n&apos;existe pas.</p>
      <Link href="/" className="btn btn-primary">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
