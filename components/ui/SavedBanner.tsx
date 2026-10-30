const MESSAGES: Record<string, string> = {
  created: 'Enregistré : création réussie ✓',
  updated: 'Enregistré : modifications sauvegardées ✓',
};

/** Bandeau de confirmation affiché après une redirection ?saved=created|updated */
export default function SavedBanner({ saved }: { saved?: string }) {
  if (!saved || !MESSAGES[saved]) return null;
  return (
    <p className="animate-fade-up rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm font-semibold text-green-300">
      {MESSAGES[saved]}
    </p>
  );
}
