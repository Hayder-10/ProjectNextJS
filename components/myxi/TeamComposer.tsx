'use client';

import { useActionState, useEffect, useState } from 'react';
import { searchPlayers, createMyTeam, updateMyTeam } from '@/app/actions/myxi';
import { FORMATIONS, type Formation, type Position } from '@/lib/validation/myxi';
import type { MyTeamItem, PickedPlayer } from '@/lib/queries/myxi';
import { formatEUR } from '@/lib/utils';
import Avatar from '@/components/football/Avatar';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import Icon from '@/components/ui/Icon';

type Slots = Record<Position, (PickedPlayer | null)[]>;

const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];
const LABELS: Record<Position, string> = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', FWD: 'Attaquant' };

/** Adapte les emplacements à une formation : garde les joueurs déjà placés, complète avec des cases vides */
function fitSlots(formation: Formation, players: (PickedPlayer | null)[]): Slots {
  const slots = {} as Slots;
  for (const pos of POSITIONS) {
    const current = players.filter((p) => p?.position === pos);
    slots[pos] = Array.from({ length: FORMATIONS[formation][pos] }, (_, i) => current[i] ?? null);
  }
  return slots;
}

type Props = {
  /** En modification : identifiant de l'élément (sinon : création) */
  id?: string;
  team?: MyTeamItem;
};

export default function TeamComposer({ id, team }: Props) {
  const [state, formAction] = useActionState(id ? updateMyTeam.bind(null, id) : createMyTeam, null);
  const [formation, setFormation] = useState<Formation>(team?.formation ?? '4-3-3');
  const [slots, setSlots] = useState<Slots>(() => fitSlots(team?.formation ?? '4-3-3', team?.players ?? []));
  const [picking, setPicking] = useState<{ position: Position; index: number } | null>(null);

  const chosen = POSITIONS.flatMap((pos) => slots[pos]).filter((p): p is PickedPlayer => p !== null);
  const totalValue = chosen.reduce((sum, p) => sum + (p.marketValueEur ?? 0), 0);
  const totalGoals = chosen.reduce((sum, p) => sum + p.goals, 0);
  const totalAssists = chosen.reduce((sum, p) => sum + p.assists, 0);

  function changeFormation(f: Formation) {
    setFormation(f);
    setSlots(fitSlots(f, chosen));
  }

  function choose(player: PickedPlayer) {
    if (!picking) return;
    setSlots((prev) => {
      const row = [...prev[picking.position]];
      row[picking.index] = player;
      return { ...prev, [picking.position]: row };
    });
    setPicking(null);
  }

  function clearSlot(position: Position, index: number) {
    setSlots((prev) => {
      const row = [...prev[position]];
      row[index] = null;
      return { ...prev, [position]: row };
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nom du XI" name="name" defaultValue={team?.name} placeholder="Mon XI de tous les temps" required minLength={2} maxLength={80} />
        <Select label="Formation" name="formation" value={formation} onChange={(e) => changeFormation(e.target.value as Formation)}>
          {Object.keys(FORMATIONS).map((f) => (
            <option key={f}>{f}</option>
          ))}
        </Select>
      </div>

      {/* Terrain : attaquants en haut, gardien en bas */}
      <div className="relative space-y-4 overflow-hidden rounded-2xl border-2 border-white/30 bg-green-700 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_80px)] p-4 shadow-2xl shadow-green-900/50">
        {/* Lignes du terrain : rond central et ligne médiane */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/25" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        {[...POSITIONS].reverse().map((pos) => (
          <div key={pos} className="relative flex justify-around gap-1">
            {slots[pos].map((player, index) => (
              <div key={index} className="flex w-16 flex-col items-center sm:w-20">
                <button
                  type="button"
                  onClick={() => setPicking({ position: pos, index })}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-2xl text-white hover:bg-white/25"
                  aria-label={`Choisir un ${LABELS[pos]}`}
                >
                  {player ? <Avatar src={player.imageUrl} name={player.name} size={52} /> : <Icon name="plus" className="h-6 w-6" />}
                </button>
                <span className="mt-1 line-clamp-1 text-center text-xs font-semibold text-white">{player ? player.name.split(' ').slice(-1)[0] : pos}</span>
                {player && (
                  <button type="button" onClick={() => clearSlot(pos, index)} className="text-[10px] text-white/80 underline">
                    retirer
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Valeur totale', value: formatEUR(totalValue) },
          { label: 'Buts cumulés', value: totalGoals },
          { label: 'Passes cumulées', value: totalAssists },
        ].map((s) => (
          <div key={s.label} className="stat">
            <p className="font-display text-xl font-bold text-amber-400">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-400">{chosen.length} / 11 joueurs choisis</p>

      {/* Les ids choisis partent avec le formulaire */}
      {chosen.map((p) => (
        <input key={p._id} type="hidden" name="players" value={p._id} />
      ))}

      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublic" defaultChecked={team?.isPublic ?? true} className="h-5 w-5 accent-green-600" />
        <span>XI public</span>
      </label>

      <FormError state={state} />
      <Button>{team ? 'Enregistrer' : 'Créer mon XI'}</Button>

      {picking && (
        <PlayerPicker
          position={picking.position}
          excludedIds={chosen.map((p) => p._id)}
          onPick={choose}
          onClose={() => setPicking(null)}
        />
      )}
    </form>
  );
}

type PickerProps = {
  position: Position;
  excludedIds: string[];
  onPick: (player: PickedPlayer) => void;
  onClose: () => void;
};

/** Fenêtre de sélection d'un joueur, filtrée sur un poste */
function PlayerPicker({ position, excludedIds, onPick, onClose }: PickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedPlayer[]>([]);
  // Recherche dont les résultats sont affichés ; « chargement » tant qu'elle diffère de la saisie
  const [loadedSearch, setLoadedSearch] = useState<string | null>(null);
  const search = `${position}|${query}`;
  const loading = loadedSearch !== search;

  // Recherche avec un délai de 300 ms entre deux frappes
  useEffect(() => {
    const timer = setTimeout(async () => {
      setResults(await searchPlayers(query, position));
      setLoadedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, position, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="surface flex max-h-[80vh] w-full max-w-lg flex-col rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-bold">Choisir un {LABELS[position].toLowerCase()}</h2>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5" aria-label="Fermer">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un joueur…" />
        </div>
        <ul className="flex-1 divide-y divide-white/5 overflow-y-auto">
          {loading && <li className="p-4 text-center text-slate-400">Recherche…</li>}
          {!loading && results.length === 0 && <li className="p-4 text-center text-slate-400">Aucun joueur trouvé.</li>}
          {!loading &&
            results.map((p) => {
              const taken = excludedIds.includes(p._id);
              return (
                <li key={p._id}>
                  <button
                    type="button"
                    disabled={taken}
                    onClick={() => onPick(p)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-green-500/10 disabled:opacity-40"
                  >
                    <Avatar src={p.imageUrl} name={p.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-xs text-slate-400">{p.clubName ?? 'Sans club'}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-amber-400">{formatEUR(p.marketValueEur)}</p>
                      <p className="text-slate-400">{p.goals} buts</p>
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
