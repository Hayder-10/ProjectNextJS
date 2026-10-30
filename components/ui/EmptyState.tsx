import Link from 'next/link';
import Icon from '@/components/ui/Icon';

type Props = { message: string; actionLabel?: string; actionHref?: string };

export default function EmptyState({ message, actionLabel, actionHref }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
      <Icon name="ball" className="mx-auto mb-3 h-10 w-10 text-slate-500" />
      <p className="mb-4 text-slate-400">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
