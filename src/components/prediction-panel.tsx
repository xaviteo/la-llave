import { ROUND_LABELS } from "@/lib/playoffs/fixture";
import { formatClock, teamById } from "@/lib/playoffs/format";
import type { PlayoffSnapshot, PredictionMap, RemainingMatch } from "@/lib/playoffs/types";
import { TeamMark } from "@/components/team-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

export function PredictionPanel({
  data,
  predictions,
  onScore,
  onClear,
  onClearMatch,
}: {
  data: PlayoffSnapshot;
  predictions: PredictionMap;
  onScore: (id: string, home: number | null, away: number | null) => void;
  onClear: () => void;
  onClearMatch: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<number, RemainingMatch[]>();
    for (const match of data.remaining) {
      const list = map.get(match.round) ?? [];
      list.push(match);
      map.set(match.round, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [data.remaining]);

  const firstOpen = grouped[0]?.[0] ?? 10;
  const [open, setOpen] = useState<number>(firstOpen);
  const filled = Object.values(predictions).filter(
    (score) => score.home !== null && score.away !== null,
  ).length;

  if (grouped.length === 0) {
    return (
      <section className="rounded-xl bg-surface p-4 text-sm text-muted shadow-[0_0_0_1px_rgba(238,242,244,0.08)]">
        No quedan partidos por jugar en la fase de zonas.
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-surface p-3 shadow-[0_0_0_1px_rgba(238,242,244,0.08)] sm:p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl tracking-wide">Predicción</h2>
          <p className="text-sm text-muted">
            Completá las fechas que faltan. Ahora sigue mostrando los cruces reales.
          </p>
        </div>
        {filled > 0 ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            Borrar {filled}
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {grouped.map(([round, matches]) => {
          const done = matches.filter((match) => {
            const score = predictions[match.id];
            return score?.home != null && score.away != null;
          }).length;
          const isOpen = open === round;
          return (
            <div key={round} className="overflow-hidden rounded-lg bg-bg">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : round)}
                className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <span className="font-display text-base tracking-wide">
                  {ROUND_LABELS[round] ?? `Fecha ${round}`}
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {done}/{matches.length}
                </span>
              </button>
              {isOpen ? (
                <ul className="border-t border-border px-2 pb-2">
                  {matches.map((match) => (
                    <PredictionRow
                      key={match.id}
                      data={data}
                      match={match}
                      prediction={predictions[match.id]}
                      onScore={onScore}
                      onClearMatch={onClearMatch}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PredictionRow({
  data,
  match,
  prediction,
  onScore,
  onClearMatch,
}: {
  data: PlayoffSnapshot;
  match: RemainingMatch;
  prediction?: { home: number | null; away: number | null };
  onScore: (id: string, home: number | null, away: number | null) => void;
  onClearMatch: (id: string) => void;
}) {
  const home = teamById(data, match.homeId);
  const away = teamById(data, match.awayId);
  const locked = match.state !== "pre";

  return (
    <li className="flex items-center gap-1.5 border-b border-border py-2 last:border-b-0 sm:gap-2">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <span className="truncate text-xs font-medium sm:text-sm">{home?.short ?? "—"}</span>
        <TeamMark team={home ?? null} size="sm" />
      </div>
      {locked ? (
        <span className="w-24 text-center font-display text-sm tabular-nums text-muted">
          {match.state === "in"
            ? `${formatClock(match)} ${match.homeScore}-${match.awayScore}`
            : "En juego"}
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <ScoreInput
            value={prediction?.home ?? null}
            ariaLabel={`Goles ${home?.short ?? "local"}`}
            onChange={(homeScore) => onScore(match.id, homeScore, prediction?.away ?? null)}
          />
          <span className="text-faint">–</span>
          <ScoreInput
            value={prediction?.away ?? null}
            ariaLabel={`Goles ${away?.short ?? "visita"}`}
            onChange={(awayScore) => onScore(match.id, prediction?.home ?? null, awayScore)}
          />
        </span>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <TeamMark team={away ?? null} size="sm" />
        <span className="truncate text-xs font-medium sm:text-sm">{away?.short ?? "—"}</span>
      </div>
      {prediction && !locked ? (
        <button
          type="button"
          aria-label={`Borrar ${home?.short ?? "local"} vs ${away?.short ?? "visita"}`}
          onClick={() => onClearMatch(match.id)}
          className="grid size-11 shrink-0 place-items-center text-faint hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <span className="size-11 shrink-0" />
      )}
    </li>
  );
}

function ScoreInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  ariaLabel: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      inputMode="numeric"
      value={value === null ? "" : String(value)}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        onChange(digits === "" ? null : Number(digits.slice(-1)));
      }}
      className={cn(
        "h-11 w-10 rounded-md bg-surface text-center font-display text-lg tabular-nums text-fg shadow-[0_0_0_1px_rgba(238,242,244,0.12)] outline-none sm:w-11",
        "focus-visible:shadow-[0_0_0_2px_rgba(126,182,212,0.7)]",
      )}
    />
  );
}
