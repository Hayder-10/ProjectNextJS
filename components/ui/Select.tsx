import { Label } from './Input';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export default function Select({ label, className = '', children, ...props }: Props) {
  return (
    <label className="block space-y-1.5">
      {label && <Label>{label}</Label>}
      <select className={`field ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
