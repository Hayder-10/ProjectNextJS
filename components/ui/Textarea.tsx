import { Label } from './Input';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };

export default function Textarea({ label, className = '', ...props }: Props) {
  return (
    <label className="block space-y-1.5">
      {label && <Label>{label}</Label>}
      <textarea className={`field ${className}`} rows={5} {...props} />
    </label>
  );
}
