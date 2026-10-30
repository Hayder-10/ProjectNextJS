'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { toggleLike } from '@/app/actions/forum';

type Props = { postId: string; liked: boolean; count: number; loggedIn: boolean };

/** Bouton like : le compteur change tout de suite (useOptimistic), puis le serveur confirme */
export default function LikeButton({ postId, liked, count, loggedIn }: Props) {
  const [, startTransition] = useTransition();
  const [state, toggleOptimistic] = useOptimistic({ liked, count }, (s) => ({
    liked: !s.liked,
    count: s.count + (s.liked ? -1 : 1),
  }));

  if (!loggedIn) {
    return (
      <Link href="/login" className="btn btn-secondary">
        🤍 {count}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          toggleOptimistic(null);
          await toggleLike(postId);
        })
      }
      className={`btn ${state.liked ? 'border border-red-500/40 bg-red-500/15 text-red-300' : 'btn-secondary'}`}
      aria-pressed={state.liked}
    >
      {state.liked ? '❤️' : '🤍'} {state.count}
    </button>
  );
}
