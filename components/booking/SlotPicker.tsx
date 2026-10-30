'use client';

import { useActionState, useState } from 'react';
import { createBooking } from '@/app/actions/booking';
import { formatTND } from '@/lib/utils';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  pitchId: string;
  date: string;
  openHour: number;
  closeHour: number;
  taken: number[];
  /** Les heures <= pastLimit sont passées (aujourd'hui) */
  pastLimit: number;
  price: number;
};

/** Un bouton par heure ; les créneaux pris ou passés sont grisés */
export default function SlotPicker({ pitchId, date, openHour, closeHour, taken, pastLimit, price }: Props) {
  const [state, formAction] = useActionState(createBooking.bind(null, pitchId), null);
  const [selected, setSelected] = useState<number | null>(null);

  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startHour" value={selected ?? ''} />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {hours.map((h) => {
          const isTaken = taken.includes(h);
          const isPast = h <= pastLimit;
          return (
            <button
              key={h}
              type="button"
              disabled={isTaken || isPast}
              onClick={() => setSelected(h)}
              className={`min-h-11 rounded-xl text-sm font-semibold ${
                selected === h
                  ? 'bg-green-500 text-slate-950 shadow-lg shadow-green-500/30'
                  : isTaken || isPast
                    ? 'cursor-not-allowed bg-white/10 text-slate-400 line-through'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/15'
              }`}
            >
              {h}h–{h + 1}h
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">Les créneaux grisés sont déjà réservés ou passés.</p>

      <FormError state={state} />
      <Button className="w-full" disabled={selected === null || taken.includes(selected)}>
        {selected === null ? 'Choisissez un créneau' : `Réserver ${selected}h–${selected + 1}h · ${formatTND(price)}`}
      </Button>
    </form>
  );
}
