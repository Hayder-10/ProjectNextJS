const colors = {
  green: 'bg-green-500/15 text-green-300 ring-green-500/30',
  amber: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  slate: 'bg-white/5 text-slate-300 ring-white/10',
  red: 'bg-red-500/15 text-red-300 ring-red-500/30',
  blue: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

export default function Badge({ color = 'slate', children }: { color?: keyof typeof colors; children: React.ReactNode }) {
  return <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${colors[color]}`}>{children}</span>;
}
