/** Fond de terrain commun au composeur et à l'affichage d'une formation */
export default function PitchFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative space-y-4 overflow-hidden rounded-2xl border-2 border-white/30 bg-green-700 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_80px)] p-4 shadow-2xl shadow-green-900/50">
      {/* Lignes du terrain : rond central et ligne médiane */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      {children}
    </div>
  );
}
