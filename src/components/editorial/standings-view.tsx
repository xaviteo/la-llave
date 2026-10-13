import { useState } from "react";
import { TeamMark } from "@/components/team-mark";
import { signed } from "@/lib/playoffs/format";
import type { StandingRow, ZoneId } from "@/lib/playoffs/types";

export function StandingsView({
  A,
  B,
  focusId,
  onFocus,
  baseline,
  predicted,
  onCruces,
}: {
  A: StandingRow[];
  B: StandingRow[];
  focusId: string | null;
  onFocus: (id: string) => void;
  baseline?: { A: StandingRow[]; B: StandingRow[] };
  predicted?: boolean;
  onCruces: () => void;
}) {
  const [zone, setZone] = useState<ZoneId>("A");
  const [full, setFull] = useState(false);
  return (
    <section>
      <div className="section-head">
        <div className="zone-tabs zone-switch" role="group" aria-label="Zona">
          <button type="button" aria-pressed={zone === "A"} onClick={() => setZone("A")}>
            Zona A
          </button>
          <button type="button" aria-pressed={zone === "B"} onClick={() => setZone("B")}>
            Zona B
          </button>
        </div>
        <div className="filter-switch" role="group" aria-label="Detalle de la tabla">
          <button type="button" aria-pressed={!full} onClick={() => setFull(false)}>
            Resumen
          </button>
          <span className="switch-slash" aria-hidden>
            /
          </span>
          <button type="button" aria-pressed={full} onClick={() => setFull(true)}>
            Estadísticas completas
          </button>
        </div>
      </div>
      {predicted ? (
        <p className="banner">
          <strong>Simulación.</strong> El orden usa los resultados que cargaste. La tabla real no cambia.
        </p>
      ) : null}
      <div className={`standings-layout both zone-${zone}${full ? " is-full" : ""}`}>
        <ZoneTable
          zone="A"
          rows={A}
          focusId={focusId}
          onFocus={onFocus}
          baseline={baseline?.A}
          full={full}
        />
        <ZoneTable
          zone="B"
          rows={B}
          focusId={focusId}
          onFocus={onFocus}
          baseline={baseline?.B}
          full={full}
        />
      </div>
      <div className="bracket-foot">
        <p className="meta" style={{ margin: 0 }}>
          Clasifican los ocho primeros de cada zona.
        </p>
        <button type="button" className="text-link" onClick={onCruces}>
          Ver cruces actuales
        </button>
      </div>
    </section>
  );
}

function ZoneTable({
  zone,
  rows,
  focusId,
  onFocus,
  baseline,
  full,
}: {
  zone: ZoneId;
  rows: StandingRow[];
  focusId: string | null;
  onFocus: (id: string) => void;
  baseline?: StandingRow[];
  full: boolean;
}) {
  return (
    <div className={`zone-block zone-${zone}`}>
      <h2 className="zone-title">Zona {zone}</h2>
      <div className="table-scroll">
        <table className="standings">
          <caption>{`Zona ${zone}. El orden respeta el desempate del torneo.`}</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col" className={`team-col${full ? " team-col-sticky" : ""}`}>
                Equipo
              </th>
              <th scope="col">Pts</th>
              <th scope="col">PJ</th>
              {full ? (
                <>
                  <th scope="col">G</th>
                  <th scope="col">E</th>
                  <th scope="col">P</th>
                  <th scope="col">GF</th>
                  <th scope="col">GC</th>
                </>
              ) : null}
              <th scope="col">DG</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((row) => {
              const prev = baseline?.find((item) => item.id === row.id);
              const climb = prev ? prev.position - row.position : 0;
              const line = (
                <tr key={row.id} className={focusId === row.id ? "is-followed" : undefined}>
                  <th scope="row" className="num">
                    {row.position}
                    {climb > 0 ? <span className="delta-up"> ↑{climb}</span> : null}
                    {climb < 0 ? <span className="delta-down"> ↓{-climb}</span> : null}
                  </th>
                  <td className={`team-col${full ? " team-col-sticky" : ""}`}>
                    <button
                      type="button"
                      className="team-button"
                      aria-pressed={focusId === row.id}
                      onClick={() => onFocus(row.id)}
                    >
                      <TeamMark team={row} size={22} />
                      <span className="team-name">{row.short}</span>
                      {focusId === row.id ? <span className="you-tag">Tu equipo</span> : null}
                    </button>
                  </td>
                  <td className="pts num">{row.pts}</td>
                  <td className="num">{row.played}</td>
                  {full ? (
                    <>
                      <td className="num">{row.wins}</td>
                      <td className="num">{row.draws}</td>
                      <td className="num">{row.losses}</td>
                      <td className="num">{row.gf}</td>
                      <td className="num">{row.ga}</td>
                    </>
                  ) : null}
                  <td className="num">{signed(row.gf - row.ga)}</td>
                </tr>
              );
              if (row.position !== 8) return [line];
              return [
                line,
                <tr key={`${row.id}-corte`} className="cutoff">
                  <td colSpan={full ? 10 : 5}>Corte de clasificación</td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
