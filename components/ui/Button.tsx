'use client';

import { useFormStatus } from 'react-dom';
import { useSyncExternalStore } from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** Bouton : dans un formulaire, affiche un spinner pendant l'envoi et se désactive hors ligne */
export default function Button({ variant = 'primary', className = '', children, disabled, type = 'submit', ...props }: Props) {
  const { pending } = useFormStatus();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const isSubmit = type === 'submit';

  return (
    <button type={type} disabled={disabled || (isSubmit && (pending || !online))} className={`btn btn-${variant} ${className}`} {...props}>
      {isSubmit && pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
