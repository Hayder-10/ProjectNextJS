/** Cartes grises affichées par les fichiers loading.tsx */
export default function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="h-10 w-1/2 animate-pulse rounded-xl bg-white/5" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
      ))}
    </div>
  );
}
