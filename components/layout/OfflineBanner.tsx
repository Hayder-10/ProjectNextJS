'use client';

import { useEffect, useState } from 'react';

/** Bandeau affiché sous le header quand le réseau est coupé */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950">
      Vous êtes hors ligne : seules les pages déjà visitées sont disponibles.
    </div>
  );
}
