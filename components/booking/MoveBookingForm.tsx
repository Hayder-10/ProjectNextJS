'use client';

import { useActionState } from 'react';
import { moveBooking } from '@/app/actions/booking';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = { bookingId: string; date: string; startHour: number; openHour: number; closeHour: number; minDate: string; maxDate: string };

export default function MoveBookingForm({ bookingId, date, startHour, openHour, closeHour, minDate, maxDate }: Props) {
  const [state, formAction] = useActionState(moveBooking.bind(null, bookingId), null);
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  return (
    <details className="w-full">
      <summary className="btn btn-secondary cursor-pointer">Déplacer</summary>
      <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-3">
        <Input label="Nouvelle date" name="date" type="date" defaultValue={date} min={minDate} max={maxDate} required />
        <Select label="Heure" name="startHour" defaultValue={startHour}>
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}h–{h + 1}h
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button className="w-full">Valider</Button>
        </div>
        <div className="sm:col-span-3">
          <FormError state={state} />
        </div>
      </form>
    </details>
  );
}
