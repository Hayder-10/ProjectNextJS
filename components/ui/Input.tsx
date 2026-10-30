type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</span>;
}

export default function Input({ label, className = '', ...props }: Props) {
  return (
    <label className="block space-y-1.5">
      {label && <Label>{label}</Label>}
      <input className={`field ${className}`} {...props} />
    </label>
  );
}
