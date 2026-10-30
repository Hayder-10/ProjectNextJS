'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (production uniquement) */
export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return null;
}
