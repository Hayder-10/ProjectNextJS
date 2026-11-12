import { formationLines, type Formation, type Position } from '@/lib/validation/myxi';
import Avatar from '@/components/football/Avatar';
import PitchFrame from '@/components/myxi/PitchFrame';

export type LineupPlayer = { name: string; position: string; imageUrl?: string };

/** Affichage en lecture seule d'une formation : attaquants en haut, gardien en bas */
export default function LineupPitch({ formation, players }: { formation: string; players: LineupPlayer[] }) {
  const byPosition = (position: Position) => players.filter((p) => p.position === position);

  return (
    <PitchFrame>
      {[...formationLines(formation as Formation)].reverse().map((line) => (
        <div key={`${line.position}-${line.start}`} className="relative flex justify-around gap-1">
          {byPosition(line.position).slice(line.start, line.start + line.count).map((player) => (
            <div key={player.name} className="flex w-16 flex-col items-center sm:w-20">
              <Avatar src={player.imageUrl} name={player.name} size={44} />
              <span className="mt-1 line-clamp-1 text-center text-xs font-semibold text-white">{player.name.split(' ').slice(-1)[0]}</span>
            </div>
          ))}
        </div>
      ))}
    </PitchFrame>
  );
}
