import Link from 'next/link';
import Icon from '@/components/ui/Icon';

type Props = {
  page: number;
  totalPages: number;
  /** Paramètres de l'URL actuelle (filtres) à conserver d'une page à l'autre */
  params: Record<string, string | undefined>;
  basePath: string;
};

export default function Pagination({ page, totalPages, params, basePath }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && search.set(k, v));
    search.set('page', String(p));
    return `${basePath}?${search}`;
  };

  return (
    <nav className="flex items-center justify-between gap-2">
      {page > 1 ? <Link href={href(page - 1)} className="btn btn-secondary"><Icon name="arrow-left" /> Précédent</Link> : <span />}
      <span className="text-sm text-slate-400">
        Page {page} / {totalPages}
      </span>
      {page < totalPages ? <Link href={href(page + 1)} className="btn btn-secondary">Suivant <Icon name="arrow-right" /></Link> : <span />}
    </nav>
  );
}
