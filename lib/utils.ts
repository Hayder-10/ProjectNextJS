/** Résultat renvoyé par les Server Actions utilisées avec useActionState */
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string } | null;

/** Convertit un document .lean() en objet simple (_id, ObjectId et dates deviennent des chaînes) */
export function toPlain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc));
}

export function formatTND(amount: number) {
  return `${amount.toFixed(3)} TND`;
}

export function formatEUR(amount?: number | null) {
  if (!amount) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Date du jour au format 'YYYY-MM-DD' (heure locale) */
export function todayString() {
  return toDateString(new Date());
}

export function toDateString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Arrondit un montant TND à 3 décimales */
export function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Saison au format 2024/25 */
export function seasonLabel(season: number) {
  return `${season}/${String((season + 1) % 100).padStart(2, '0')}`;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Échappe une saisie utilisateur avant de l'utiliser dans une $regex */
export function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
