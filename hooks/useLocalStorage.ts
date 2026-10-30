'use client';

import { useEffect, useState } from 'react';

/** Comme useState, mais la valeur est sauvegardée dans localStorage */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  // Lecture au montage (localStorage n'existe pas côté serveur) : le premier rendu doit
  // être identique au HTML du serveur, la valeur sauvegardée n'arrive donc qu'ensuite.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture voulue après l'hydratation
      if (raw) setValue(JSON.parse(raw));
    } catch {
      // valeur illisible : on garde la valeur initiale
    }
    setLoaded(true);
  }, [key]);

  // Écriture à chaque changement, une fois la valeur chargée
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // stockage plein ou bloqué
    }
  }, [key, value, loaded]);

  return [value, setValue] as const;
}
