import { useMemo } from "react";
import { TeamMark } from "@/components/team-mark";
import { agendaGroups, formatClock, teamById } from "@/lib/playoffs/format";
import type { MatchRow, PlayoffSnapshot } from "@/lib/playoffs/types";
import { cn } from "@/lib/utils";

export function MatchStrip({
  data,
  focusId,
  onFocus,
}: {
  data: PlayoffSnapshot;
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  const groups = useMemo(() => agendaGroups(data.agenda), [data.agenda]);

  if (groups.length === 0) return null;

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg tracking-wide text-fg">
          {data.agendaRound ? `Fecha ${data.agendaRound}` : "Esta fecha"}
        </h2>
        <p className="text-xs text-muted">Hora argentina</p>
      </div>
      <div className="panel rounded-xl bg-surface px-1.5 py-1.5 sm:px-2">
        {groups.map((group) => (
          <div key={group.key} className="border-b border-border py-1 last:border-b-0">
            <h3
              className={cn(
                "px-1.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                group.today ? "font-display text-sm tracking-[0.2em] text-fg" : "text-muted",
              )}
            >
              {group.label}
            </h3>
            <ul className="grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-3">
              {group.matches.map((match) => (
                <AgendaRow
                  key={match.id}
                  data={data}
                  match={match}
                  focusId={focusId}
                  onFocus={onFocus}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgendaRow({
  data,
  match,
  focusId,
  onFocus,
}: {
  data: PlayoffSnapshot;
  match: MatchRow;
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  const home = teamById(data, match.homeId);
  const away = teamById(data, match.awayId);
  const live = match.state === "in";
  const started = match.state !== "pre";
  const active = Boolean(focusId && (focusId === match.homeId || focusId === match.awayId));
  const homeName = home?.short ?? "Local";
  const awayName = away?.short ?? "Visita";
  const when = formatClock(match);

  return (
    <li>
      <button
        type="button"
        onClick={() => onFocus(home?.id ?? away?.id ?? "")}
        title={`${homeName} vs ${awayName}`}
        className={cn(
          "flex min-h-8 w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors duration-150",
          active && "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "inline-flex w-14 shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums text-muted",
            live && "text-live",
          )}
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", live ? "live-dot bg-live" : "opacity-0")} />
          {when}
        </span>
        <TeamMark team={home ?? null} size="xs" />
        <span className="min-w-0 shrink truncate text-xs font-medium">{homeName}</span>
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold tabular-nums",
            started ? "text-fg" : "text-faint",
            live && "text-live",
          )}
        >
          {started ? `${match.homeScore}-${match.awayScore}` : "vs"}
        </span>
        <TeamMark team={away ?? null} size="xs" />
        <span className="min-w-0 shrink truncate text-xs font-medium">{awayName}</span>
      </button>
    </li>
  );
}
