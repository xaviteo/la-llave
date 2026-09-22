import { Home } from "lucide-react";
import { LLAVE_1, LLAVE_2, matchesByIds } from "@/lib/playoffs/logic";
import type { BracketSide, KnockoutMatch, PlayoffSnapshot } from "@/lib/playoffs/types";
import { TeamMark } from "@/components/team-mark";
import { cn } from "@/lib/utils";

export function BracketBoard({
  data,
  focusId,
  onFocus,
  title = "Octavos, ahora",
  changedIds,
  showLiveBadge = true,
}: {
  data: PlayoffSnapshot;
  focusId: string | null;
  onFocus: (id: string) => void;
  title?: string;
  changedIds?: Set<string>;
  showLiveBadge?: boolean;
}) {
  const left = matchesByIds(data.octavos, LLAVE_1);
  const right = matchesByIds(data.octavos, LLAVE_2);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl tracking-wide">{title}</h2>
          <p className="text-sm text-muted">
            1° de una zona vs 8° de la otra. Local el mejor de la fase regular.
          </p>
        </div>
        {showLiveBadge && data.projected ? (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
            Con partidos en curso
          </span>
        ) : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <LlaveColumn
          title="Llave 1"
          caption="Ganadores → C1 (P1 vs P8) y C4 (P4 vs P5). Semifinal S1."
          matches={left}
          pairs={[
            ["P1", "P8", "C1"],
            ["P4", "P5", "C4"],
          ]}
          focusId={focusId}
          onFocus={onFocus}
          changedIds={changedIds}
        />
        <LlaveColumn
          title="Llave 2"
          caption="Ganadores → C2 (P2 vs P7) y C3 (P3 vs P6). Semifinal S2."
          matches={right}
          pairs={[
            ["P2", "P7", "C2"],
            ["P3", "P6", "C3"],
          ]}
          focusId={focusId}
          onFocus={onFocus}
          changedIds={changedIds}
        />
      </div>
      <p className="mt-4 text-sm text-muted">{data.finalNote}</p>
    </section>
  );
}

function LlaveColumn({
  title,
  caption,
  matches,
  pairs,
  focusId,
  onFocus,
  changedIds,
}: {
  title: string;
  caption: string;
  matches: KnockoutMatch[];
  pairs: Array<[string, string, string]>;
  focusId: string | null;
  onFocus: (id: string) => void;
  changedIds?: Set<string>;
}) {
  return (
    <div className="rounded-xl bg-surface p-3 shadow-[0_0_0_1px_rgba(238,242,244,0.08)] sm:p-4">
      <div className="mb-3">
        <h3 className="font-display text-xl tracking-wide">{title}</h3>
        <p className="text-xs text-muted">{caption}</p>
      </div>
      <div className="flex flex-col gap-4">
        {pairs.map(([a, b, quarter]) => {
          const first = matches.find((match) => match.id === a);
          const second = matches.find((match) => match.id === b);
          if (!first || !second) return null;
          return (
            <div key={quarter} className="grid gap-2">
              <MatchCard
                match={first}
                focusId={focusId}
                onFocus={onFocus}
                changed={changedIds?.has(first.id) ?? false}
              />
              <MatchCard
                match={second}
                focusId={focusId}
                onFocus={onFocus}
                changed={changedIds?.has(second.id) ?? false}
              />
              <p className="px-1 text-[11px] uppercase tracking-widest text-faint">
                Ganadores a {quarter}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  focusId,
  onFocus,
  changed,
}: {
  match: KnockoutMatch;
  focusId: string | null;
  onFocus: (id: string) => void;
  changed: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-lg bg-bg p-2.5 shadow-[0_0_0_1px_rgba(238,242,244,0.08)]",
        changed && "shadow-[0_0_0_1px_rgba(126,182,212,0.55)]",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="font-display text-sm tracking-wider text-muted">{match.label}</span>
        <span className="inline-flex max-w-[55%] items-center gap-1 truncate text-[11px] text-muted">
          {changed ? <span className="font-semibold uppercase tracking-wide text-accent">Cambió</span> : null}
          <Home className="size-3" />
          {match.homeAdvantage.replace("Local en ", "")}
        </span>
      </div>
      <TeamRow side={match.home} host focusId={focusId} onFocus={onFocus} />
      <TeamRow side={match.away} focusId={focusId} onFocus={onFocus} />
    </article>
  );
}

function TeamRow({
  side,
  host = false,
  focusId,
  onFocus,
}: {
  side: BracketSide;
  host?: boolean;
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  const team = side.team;
  const active = Boolean(team && focusId === team.id);
  return (
    <button
      type="button"
      onClick={() => team && onFocus(team.id)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors duration-150",
        active ? "bg-surface-2" : "hover:bg-surface-2/70",
        !team && "opacity-60",
      )}
    >
      <span
        className="h-8 w-1 rounded-full"
        style={{ backgroundColor: team?.color ?? "var(--color-faint)" }}
      />
      <span className="w-6 text-center font-display text-sm tabular-nums text-muted">
        {side.seed}°
      </span>
      <TeamMark team={team} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {team?.short ?? `${side.seed}° Zona ${side.zone}`}
        </span>
        <span className="block text-[11px] text-faint">
          Zona {side.zone}
          {team ? ` · ${team.pts} pts` : ""}
          {host ? " · local" : ""}
        </span>
      </span>
      {team ? (
        <span className="font-display text-base tabular-nums text-muted">{team.pts}</span>
      ) : null}
    </button>
  );
}
