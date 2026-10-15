import { useMemo, useState } from "react";
import { TeamMark } from "@/components/team-mark";
import { buildAnnual, cupLabel, type AnnualRow } from "@/lib/playoffs/annual";
import { signed } from "@/lib/playoffs/format";
import type { AperturaTotal, StandingRow, ZoneId } from "@/lib/playoffs/types";

type TablePane = ZoneId | "anual";

export function StandingsView({
  A,
  B,
  apertura,
  focusId,
  onFocus,
  baseline,
  predicted,
  onCruces,
}: {
  A: StandingRow[];
  B: StandingRow[];
  apertura: AperturaTotal[];
  focusId: string | null;
  onFocus: (id: string) => void;
  baseline?: { A: StandingRow[]; B: StandingRow[] };
  predicted?: boolean;
  onCruces: () => void;
}) {
  const [zone, setZone] = useState<TablePane>("A");
  const [full, setFull] = useState(false);
  const annual = useMemo(() => buildAnnual([...A, ...B], apertura), [A, B, apertura]);
  const provisional = A.concat(B).some((row) => row.projected);
  return (
    <section>
      <div className="section-head">
        <div className="zone-tabs zone-switch" role="group" aria-label="Tabla">
          <button type="button" aria-pressed={zone === "A"} onClick={() => setZone("A")}>
            Zona A
          </button>
          <button type="button" aria-pressed={zone === "B"} onClick={() => setZone("B")}>
            Zona B
          </button>
          <button type="button" aria-pressed={zone === "anual"} onClick={() => setZone("anual")}>
            Anual
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
        <ZoneTable zone="A" rows={A} focusId={focusId} onFocus={onFocus} baseline={baseline?.A} full={full} />
        <ZoneTable zone="B" rows={B} focusId={focusId} onFocus={onFocus} baseline={baseline?.B} full={full} />
        <AnnualTable
          rows={annual}
          full={full}
          focusId={focusId}
          onFocus={onFocus}
          provisional={provisional && !predicted}
        />
      </div>
      <div className="bracket-foot">
        <p className="meta" style={{ margin: 0 }}>
          En cada zona, el fondo marca a los ocho que clasifican a los cruces.
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
      <h2 className="zone-title">
        Zona <span className="zone-mark">{zone}</span>
      </h2>
      <p className="zone-legend">Los ocho primeros clasifican.</p>
      <div className="table-scroll">
        <table className="standings">
          <caption>{`Zona ${zone}. Los ocho primeros clasifican a los cruces. El orden respeta el desempate del torneo.`}</caption>
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
            {rows.map((row) => {
              const prev = baseline?.find((item) => item.id === row.id);
              const climb = prev ? prev.position - row.position : 0;
              const qualified = row.position <= 8;
              return (
                <tr
                  key={row.id}
                  className={
                    [
                      qualified ? "is-in" : "",
                      row.position === 8 ? "is-last-in" : "",
                      focusId === row.id ? "is-followed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                >
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cupBlock(marks: AnnualRow["marks"]): "lib" | "previa" | "suda" | "" {
  if (marks.includes("libertadores") || marks.includes("libertadores-apertura")) return "lib";
  if (marks.includes("libertadores-previa")) return "previa";
  if (marks.includes("sudamericana")) return "suda";
  return "";
}

function AnnualTable({
  rows,
  full,
  focusId,
  onFocus,
  provisional,
}: {
  rows: AnnualRow[];
  full: boolean;
  focusId: string | null;
  onFocus: (id: string) => void;
  provisional: boolean;
}) {
  return (
    <div className="annual-block">
      <h2 className="zone-title">Tabla anual</h2>
      <p className="zone-legend">Apertura más Clausura. El primero es campeón de Liga.</p>
      {rows.length === 0 ? (
        <p className="banner">La tabla anual necesita el Apertura, que ahora no está disponible.</p>
      ) : (
        <div className="table-scroll">
          <table className="standings annual">
            <caption>
              Tabla anual 2026. Suma de la fase regular del Apertura y del Clausura. El color marca al campeón
              de Liga, la Libertadores, la fase previa y la Sudamericana. Belgrano ya está en la Libertadores
              por el Apertura.
            </caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col" className={`team-col${full ? " team-col-sticky" : ""}`}>
                  Equipo
                </th>
                <th scope="col">Pts</th>
                <th scope="col" title="Puntos del Apertura">
                  Ap.
                </th>
                <th scope="col" title="Puntos del Clausura">
                  Cl.
                </th>
                {full ? (
                  <>
                    <th scope="col">PJ</th>
                    <th scope="col">GF</th>
                    <th scope="col">GC</th>
                    <th scope="col">DG</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const block = cupBlock(row.marks);
                const prev = index > 0 ? cupBlock(rows[index - 1]?.marks ?? []) : "";
                const next = index < rows.length - 1 ? cupBlock(rows[index + 1]?.marks ?? []) : "";
                return (
                <tr
                  key={row.id}
                  className={
                    [
                      block ? `cup-${block}` : "",
                      block && block !== prev ? "is-block-start" : "",
                      block && block !== next ? "is-block-end" : "",
                      row.marks.includes("campeon") ? "is-champion" : "",
                      focusId === row.id ? "is-followed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                >
                  <th scope="row" className="num">
                    {row.position}
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
                      {row.marks.length > 0 ? (
                        <span className="sr-only">{row.marks.map(cupLabel).join(", ")}</span>
                      ) : null}
                      {focusId === row.id ? <span className="you-tag">Tu equipo</span> : null}
                    </button>
                  </td>
                  <td className="pts num">{row.pts}</td>
                  <td className="num">{row.aperturaPts}</td>
                  <td className="num">{row.clausuraPts}</td>
                  {full ? (
                    <>
                      <td className="num">{row.played}</td>
                      <td className="num">{row.gf}</td>
                      <td className="num">{row.ga}</td>
                      <td className="num">{signed(row.gf - row.ga)}</td>
                    </>
                  ) : null}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 ? (
        <ul className="cup-key">
          <li>
            <span className="cup-swatch is-champion" />
            Campeón de Liga
          </li>
          <li>
            <span className="cup-swatch cup-lib" />
            Libertadores, fase de grupos
          </li>
          <li>
            <span className="cup-swatch cup-previa" />
            Libertadores, fase previa
          </li>
          <li>
            <span className="cup-swatch cup-suda" />
            Sudamericana
          </li>
        </ul>
      ) : null}
      <p className="annual-note">
        Suma de la fase regular del Apertura y del Clausura. Los playoffs no entran.
        {provisional ? " Con un partido en juego, el Clausura es provisorio." : ""} Belgrano ya está
        en la Libertadores por el Apertura y no usa un lugar de esta tabla: el cupo pasa al
        siguiente. El campeón del Clausura y el de la Copa Argentina se suman cuando se definan.
      </p>
    </div>
  );
}
