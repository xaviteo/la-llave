import { useMemo, useState } from "react";
import { TeamMark } from "@/components/team-mark";
import { ROUND_LABELS } from "@/lib/playoffs/fixture";
import { formatClock, teamById } from "@/lib/playoffs/format";
import { readGoal } from "@/lib/playoffs/scores";
import type { PlayoffSnapshot, PredictionMap, RemainingMatch, StandingRow } from "@/lib/playoffs/types";

export function SimulationView({
  live,
  predicted,
  predictions,
  focusId,
  onFocus,
  onScore,
  onClear,
  onUndo,
  canUndo,
  onCruces,
}: {
  live: PlayoffSnapshot;
  predicted: PlayoffSnapshot;
  predictions: PredictionMap;
  focusId: string | null;
  onFocus: (id: string) => void;
  onScore: (id: string, home: number | null, away: number | null) => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onCruces: () => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<number, RemainingMatch[]>();
    for (const match of live.remaining) {
      const list = map.get(match.round) ?? [];
      list.push(match);
      map.set(match.round, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [live.remaining]);
  const [round, setRound] = useState<number | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const selected = round ?? grouped[0]?.[0] ?? null;
  const matches = (grouped.find((entry) => entry[0] === selected)?.[1] ?? []).filter((match) => {
    if (!onlyMine || !focusId) return true;
    return match.homeId === focusId || match.awayId === focusId;
  });
  const open = (grouped.find((entry) => entry[0] === selected)?.[1] ?? []).filter(
    (match) => match.state === "pre",
  );
  const done = open.filter((match) => {
    const score = predictions[match.id];
    return score?.home != null && score.away != null;
  }).length;
  const filled = Object.values(predictions).filter(
    (score) => score.home != null && score.away != null,
  ).length;
  const team = focusId ? teamById(predicted, focusId) : undefined;
  const before = focusId ? teamById(live, focusId) : undefined;

  if (grouped.length === 0) {
    return (
      <p className="banner">No quedan partidos por jugar en la fase de zonas.</p>
    );
  }

  return (
    <div>
      <p className="sim-alert">Simulación · Estos resultados no modifican la tabla real.</p>
      <div className="sim-layout">
        <div>
          <div className="fecha-bar">
            <div className="fecha-pager">
              <button
                type="button"
                className="fecha-arrow"
                aria-label="Fecha anterior"
                disabled={grouped.findIndex((entry) => entry[0] === selected) <= 0}
                onClick={() => {
                  const index = grouped.findIndex((entry) => entry[0] === selected);
                  const prev = grouped[index - 1];
                  if (prev) setRound(prev[0]);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path d="M11.5 3.5 L5.5 9 L11.5 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>
              <h2>{selected ? `Fecha ${selected}` : "Fechas"}</h2>
              <button
                type="button"
                className="fecha-arrow"
                aria-label="Fecha siguiente"
                disabled={grouped.findIndex((entry) => entry[0] === selected) >= grouped.length - 1}
                onClick={() => {
                  const index = grouped.findIndex((entry) => entry[0] === selected);
                  const next = grouped[index + 1];
                  if (next) setRound(next[0]);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path d="M6.5 3.5 L12.5 9 L6.5 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>
            </div>
            <div className="fecha-tools">
              <div className="filter-switch" role="group" aria-label="Filtro de partidos">
                <button type="button" aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>
                  Todos
                </button>
                <span className="switch-slash" aria-hidden>
                  /
                </span>
                <button type="button" aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>
                  Mi equipo
                </button>
              </div>
              <span className="num meta">
                {done} de {open.length} completados
              </span>
            </div>
          </div>
          <div className="zone-tabs" aria-label="Fechas pendientes">
            {grouped.map(([item]) => (
              <button key={item} type="button" aria-pressed={item === selected} onClick={() => setRound(item)}>
                {ROUND_LABELS[item] ?? `Fecha ${item}`}
              </button>
            ))}
          </div>
          {onlyMine && !focusId ? (
            <p className="banner">Tocá un equipo para ver solo sus partidos.</p>
          ) : null}
          {matches.length === 0 ? <p className="banner">No hay partidos para este filtro.</p> : null}
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {matches.map((match, index) => (
              <SimRow
                key={match.id}
                index={index + 1}
                data={live}
                match={match}
                prediction={predictions[match.id]}
                focusId={focusId}
                onFocus={onFocus}
                onScore={onScore}
              />
            ))}
          </ol>
          <div className="confirm-reset">
            {canUndo ? (
              <button type="button" className="text-link" onClick={onUndo}>
                Deshacer último cambio
              </button>
            ) : null}
            {filled > 0 && !confirmReset ? (
              <button type="button" className="text-link" onClick={() => setConfirmReset(true)}>
                Reiniciar simulación
              </button>
            ) : null}
            {confirmReset ? (
              <>
                <span>¿Borrar los resultados cargados?</span>
                <button
                  type="button"
                  className="btn btn-ink"
                  onClick={() => {
                    onClear();
                    setConfirmReset(false);
                  }}
                >
                  Borrar
                </button>
                <button type="button" className="text-link" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </button>
              </>
            ) : null}
          </div>
        </div>
        <aside className="context-col">
          <h2>Tu escenario</h2>
          {team && before ? (
            <>
              <p className="fact" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <TeamMark team={team} size={32} />
                <strong>{team.short}</strong>
                <span className="meta">Zona {team.zone}</span>
              </p>
              <p className="impact-points num">
                {before.pts} → {team.pts} pts
              </p>
              <p className="impact-points num">
                {before.position}° → {team.position}° en Zona {team.zone}
              </p>
              {filled === 0 ? (
                <p className="fact">Cargá un resultado completo para mover esta tabla.</p>
              ) : done < open.length ? (
                <p className="fact">
                  Faltan resultados de esta fecha. La tabla usa solo los partidos que completaste, en
                  todas las fechas.
                </p>
              ) : null}
              <table className="impact-table">
                <caption className="sr-only">Zona {team.zone} con la simulación cargada</caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Equipo</th>
                    <th scope="col">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {(team.zone === "A" ? predicted.zones.A : predicted.zones.B).map((row) => (
                    <tr key={row.id} className={row.id === team.id ? "is-followed" : undefined}>
                      <td className="num">{row.position}</td>
                      <td>{row.short}</td>
                      <td className="num">{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="fact">Seguí un equipo para ver cómo cambia su puesto.</p>
          )}
          <button type="button" className="btn btn-ink" onClick={onCruces} style={{ marginTop: 16 }}>
            Ver mis cruces
          </button>
        </aside>
      </div>
    </div>
  );
}

function SimRow({
  index,
  data,
  match,
  prediction,
  focusId,
  onFocus,
  onScore,
}: {
  index: number;
  data: PlayoffSnapshot;
  match: RemainingMatch;
  prediction?: { home: number | null; away: number | null };
  focusId: string | null;
  onFocus: (id: string) => void;
  onScore: (id: string, home: number | null, away: number | null) => void;
}) {
  const home = teamById(data, match.homeId);
  const away = teamById(data, match.awayId);
  const locked = match.state !== "pre";
  const followed = focusId === match.homeId || focusId === match.awayId;
  return (
    <li className={`sim-row${followed ? " is-followed" : ""}`}>
      <span className="meta num">{index}.</span>
      <TeamButton team={home} focusId={focusId} onFocus={onFocus} local />
      {locked ? (
        <span className="num meta">
          {match.state === "in" ? `${formatClock(match)} ${match.homeScore}–${match.awayScore}` : "En juego"}
        </span>
      ) : (
        <span className="score-inputs">
          <label className="sr-only" htmlFor={`${match.id}-home`}>
            Goles de {home?.name ?? "local"}
          </label>
          <input
            id={`${match.id}-home`}
            className="score-input num"
            inputMode="numeric"
            value={prediction?.home == null ? "" : String(prediction.home)}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onScore(match.id, readGoal(event.target.value), prediction?.away ?? null)}
          />
          <span aria-hidden>–</span>
          <label className="sr-only" htmlFor={`${match.id}-away`}>
            Goles de {away?.name ?? "visita"}
          </label>
          <input
            id={`${match.id}-away`}
            className="score-input num"
            inputMode="numeric"
            value={prediction?.away == null ? "" : String(prediction.away)}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onScore(match.id, prediction?.home ?? null, readGoal(event.target.value))}
          />
        </span>
      )}
      <TeamButton team={away} focusId={focusId} onFocus={onFocus} />
    </li>
  );
}

function TeamButton({
  team,
  focusId,
  onFocus,
  local = false,
}: {
  team: StandingRow | undefined;
  focusId: string | null;
  onFocus: (id: string) => void;
  local?: boolean;
}) {
  if (!team) return <span className="team-name">A definir</span>;
  return (
    <button
      type="button"
      className="team-button"
      aria-pressed={focusId === team.id}
      onClick={() => onFocus(team.id)}
    >
      <TeamMark team={team} size={28} />
      <span className="team-name">
        {team.short}
        {local ? <span className="local-tag"> Local</span> : null}
      </span>
      {focusId === team.id ? <span className="you-tag">Tu equipo</span> : null}
    </button>
  );
}
