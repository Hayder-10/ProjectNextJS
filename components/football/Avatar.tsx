'use client';

import { useState } from 'react';
import { initials } from '@/lib/utils';

type Props = { src?: string; name: string; size?: number; rounded?: boolean };

/** Photo de joueur ou logo de club ; affiche les initiales si l'image ne charge pas */
export default function Avatar({ src, name, size = 40, rounded = true }: Props) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  const shape = rounded ? 'rounded-full' : 'rounded-lg';

  if (!src || failed) {
    return (
      <div
        style={{ ...style, fontSize: size / 2.8 }}
        className={`flex shrink-0 items-center justify-center bg-white/10 font-bold text-slate-400 ${shape}`}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      style={style}
      onError={() => setFailed(true)}
      className={`shrink-0 bg-white/5 object-cover ${shape}`}
      referrerPolicy="no-referrer"
    />
  );
}
