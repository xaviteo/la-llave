import { formatClock, teamById } from "@/lib/playoffs/format";
import type { PlayoffSnapshot } from "@/lib/playoffs/types";
import { TeamMark } from "@/components/team-mark";
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
  if (data.matches.length === 0) return null;

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg tracking-wide text-fg">Esta fecha</h2>
        <p className="text-xs text-muted">
          {data.projected ? "El marcador en curso ya mueve los cruces" : "Al jugarse, actualizan la llave"}
        </p>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {data.matches.map((match) => {
          const home = teamById(data, match.homeId);
          const away = teamById(data, match.awayId);
          const live = match.state === "in";
          const active = focusId && (focusId === match.homeId || focusId === match.awayId);
          const showScore = match.state !== "pre";
          return (
            <button
              key={match.id}
              type="button"
              onClick={() => onFocus(home?.id ?? away?.id ?? "")}
              className={cn(
                "flex min-h-11 min-w-[17.5rem] shrink-0 items-center gap-2 rounded-lg bg-surface px-3 py-2 text-left shadow-[0_0_0_1px_rgba(238,242,244,0.08)] transition-[box-shadow,background-color] duration-150",
                live && "shadow-[0_0_0_1px_rgba(224,91,91,0.45)]",
                active && "bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "w-[3.25rem] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted",
                  live && "text-live",
                )}
              >
                {live ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="live-dot size-1.5 rounded-full bg-live" />
                    {formatClock(match)}
                  </span>
                ) : (
                  formatClock(match)
                )}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <TeamMark team={home ?? null} size="sm" />
                <span className="min-w-0 truncate text-sm font-medium">{home?.short ?? "—"}</span>
              </span>
              <span className="shrink-0 font-display text-sm tabular-nums text-fg">
                {showScore ? `${match.homeScore}-${match.awayScore}` : "vs"}
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                <span className="min-w-0 truncate text-sm font-medium">{away?.short ?? "—"}</span>
                <TeamMark team={away ?? null} size="sm" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
