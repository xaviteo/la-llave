import { signed } from "@/lib/playoffs/format";
import type { StandingRow, ZoneId } from "@/lib/playoffs/types";
import { TeamMark } from "@/components/team-mark";
import { cn } from "@/lib/utils";

export function ZoneTables({
  A,
  B,
  focusId,
  onFocus,
  baseline,
  predicted,
}: {
  A: StandingRow[];
  B: StandingRow[];
  focusId: string | null;
  onFocus: (id: string) => void;
  baseline?: { A: StandingRow[]; B: StandingRow[] };
  predicted?: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ZoneTable
        zone="A"
        rows={A}
        focusId={focusId}
        onFocus={onFocus}
        baseline={baseline?.A}
        predicted={predicted}
      />
      <ZoneTable
        zone="B"
        rows={B}
        focusId={focusId}
        onFocus={onFocus}
        baseline={baseline?.B}
        predicted={predicted}
      />
    </section>
  );
}

function ZoneTable({
  zone,
  rows,
  focusId,
  onFocus,
  baseline,
  predicted,
}: {
  zone: ZoneId;
  rows: StandingRow[];
  focusId: string | null;
  onFocus: (id: string) => void;
  baseline?: StandingRow[];
  predicted?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-[0_0_0_1px_rgba(238,242,244,0.08)]">
      <div className="flex items-baseline justify-between px-4 py-3">
        <h2 className="font-display text-xl tracking-wide">Zona {zone}</h2>
        <p className="text-[11px] uppercase tracking-widest text-muted">Clasifican 1° a 8°</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-faint">
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-2 py-2 text-left font-medium">Equipo</th>
              <th className="px-2 py-2 text-right font-medium">Pts</th>
              <th className="px-2 py-2 text-right font-medium">PJ</th>
              <th className="px-2 py-2 text-right font-medium">G</th>
              <th className="px-2 py-2 text-right font-medium">E</th>
              <th className="px-2 py-2 text-right font-medium">P</th>
              <th className="px-2 py-2 text-right font-medium">GF</th>
              <th className="px-2 py-2 text-right font-medium">GC</th>
              <th className="px-3 py-2 text-right font-medium">DG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const inPlayoff = row.position <= 8;
              const cutoff = row.position === 8;
              const active = focusId === row.id;
              const prev = baseline?.find((item) => item.id === row.id);
              const climb = prev ? prev.position - row.position : 0;
              const extraMatch = Boolean(prev && prev.played !== row.played);
              return (
                <tr
                  key={row.id}
                  onClick={() => onFocus(row.id)}
                  className={cn(
                    "cursor-pointer border-t border-border tabular-nums transition-colors duration-150",
                    inPlayoff ? "bg-qualify/10" : "bg-transparent",
                    cutoff && "border-b-2 border-b-qualify/80",
                    active && "bg-surface-2",
                  )}
                >
                  <td className="px-3 py-2 font-display text-muted">
                    <span className="inline-flex items-center gap-1">
                      {row.position}
                      {climb > 0 ? (
                        <span className="text-[10px] font-semibold text-qualify">↑{climb}</span>
                      ) : climb < 0 ? (
                        <span className="text-[10px] font-semibold text-danger">↓{-climb}</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2 text-left">
                      <TeamMark team={row} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{row.short}</span>
                        {predicted && extraMatch ? (
                          <span className="text-[10px] uppercase tracking-wide text-accent">
                            Predicción
                          </span>
                        ) : !predicted && row.projected ? (
                          <span className="text-[10px] uppercase tracking-wide text-accent">
                            En juego
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{row.pts}</td>
                  <td className="px-2 py-2 text-right text-muted">{row.played}</td>
                  <td className="px-2 py-2 text-right text-muted">{row.wins}</td>
                  <td className="px-2 py-2 text-right text-muted">{row.draws}</td>
                  <td className="px-2 py-2 text-right text-muted">{row.losses}</td>
                  <td className="px-2 py-2 text-right text-muted">{row.gf}</td>
                  <td className="px-2 py-2 text-right text-muted">{row.ga}</td>
                  <td className="px-3 py-2 text-right text-muted">{signed(row.gf - row.ga)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
