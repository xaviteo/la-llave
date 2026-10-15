import { useMemo, useState } from "react";
import { TeamMark } from "@/components/team-mark";
import {
  agendaGroups,
  fechaBoards,
  formatUpdatedStamp,
  matchStatus,
  teamById,
  withTodayMatches,
} from "@/lib/playoffs/format";
import type { MatchRow, PlayoffSnapshot, StandingRow } from "@/lib/playoffs/types";

export function ResultsView({
  data,
  focusId,
  onFocus,
  onCruces,
  stale,
}: {
  data: PlayoffSnapshot;
  focusId: string | null;
  onFocus: (id: string) => void;
  onCruces: () => void;
  stale: boolean;
}) {
  const boards = useMemo(
    () => fechaBoards(data.calendar ?? [], data.remaining),
    [data.calendar, data.remaining],
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const round = boards.some((item) => item.round === picked)
    ? picked
    : (data.agendaRound ?? boards[0]?.round ?? null);
  const board = boards.find((item) => item.round === round) ?? null;
  const known = useMemo(() => new Set(boards.map((item) => item.round)), [boards]);
  const numbers = useMemo(() => {
    const max = boards.reduce((peak, item) => Math.max(peak, item.round), 0);
    if (max === 0) return [];
    return Array.from({ length: Math.max(16, max) }, (_, index) => index + 1);
  }, [boards]);
  const index = boards.findIndex((item) => item.round === round);
  const matches = useMemo(() => {
    const current = round != null && round === data.agendaRound;
    const merged = current
      ? withTodayMatches(board?.matches ?? [], data.calendar ?? [])
      : (board?.matches ?? []);
    if (!onlyMine || !focusId) return merged;
    return merged.filter((match) => match.homeId === focusId || match.awayId === focusId);
  }, [board, data.agendaRound, data.calendar, onlyMine, focusId, round]);
  const groups = useMemo(() => agendaGroups(matches), [matches]);
  const followed = focusId ? teamById(data, focusId) : undefined;
  const last = useMemo(() => lastResult(data, focusId), [data, focusId]);
  const next = index >= 0 ? boards[index + 1] : undefined;

  return (
    <div className="results-layout">
      <div>
        <div className="fecha-bar">
          <div className="fecha-pager">
            <button
              type="button"
              className="fecha-arrow"
              aria-label="Fecha anterior"
              onClick={() => {
                const prev = boards[index - 1];
                if (prev) setPicked(prev.round);
              }}
              disabled={index <= 0}
            >
              <Arrow dir="prev" />
            </button>
            <h2>{board ? `Fecha ${board.round}` : "Sin fecha"}</h2>
            <button
              type="button"
              className="fecha-arrow"
              aria-label="Fecha siguiente"
              onClick={() => {
                const following = boards[index + 1];
                if (following) setPicked(following.round);
              }}
              disabled={index < 0 || index >= boards.length - 1}
            >
              <Arrow dir="next" />
            </button>
          </div>
          {numbers.length > 0 ? (
            <div className="fecha-index" role="group" aria-label="Todas las fechas">
              {numbers.map((item) => {
                const available = known.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={item === round}
                    aria-label={`Fecha ${item}`}
                    disabled={!available}
                    onClick={() => setPicked(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          ) : null}
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
            <span className="meta">Hora argentina</span>
          </div>
        </div>
        {stale ? <p className="banner">Último dato disponible.</p> : null}
        {onlyMine && !focusId ? (
          <p className="banner">Tocá un equipo para seguirlo y filtrar sus partidos.</p>
        ) : null}
        {groups.length === 0 ? (
          <p className="banner">
            {onlyMine ? "Tu equipo no juega en esta fecha." : "No hay partidos cargados en esta fecha."}
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.key}>
              <h3 className="day-label">
                <span>{group.label}</span>
                <span>Estado</span>
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {group.matches.map((match) => (
                  <ScoreRow
                    key={match.id}
                    data={data}
                    match={match}
                    focusId={focusId}
                    onFocus={onFocus}
                    note={
                      board && match.round != null && match.round !== board.round
                        ? `Fecha ${match.round}`
                        : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
      <aside className="context-col">
        <h2>{followed ? followed.short : "Tu equipo"}</h2>
        {followed && last ? (
          <>
            <div className="context-score num">
              <TeamMark team={teamById(data, last.homeId) ?? null} size={32} />
              <span>
                {last.homeScore} – {last.awayScore}
              </span>
              <TeamMark team={teamById(data, last.awayId) ?? null} size={32} />
            </div>
            <p className="fact">{factLine(followed, last, data)}</p>
          </>
        ) : (
          <p className="fact">
            {followed
              ? "Todavía no hay un resultado final de este equipo en los datos cargados."
              : "Elegí un club en un partido o en la tabla para ver su último resultado."}
          </p>
        )}
        <button type="button" className="text-link" onClick={onCruces}>
          Ver cómo quedan los cruces
        </button>
        {next ? (
          <>
            <h2 style={{ marginTop: 28 }}>Próxima fecha</h2>
            <p className="fact">
              Fecha {next.round}
              {next.matches.some((match) => match.date) ? "" : " · Horarios a confirmar."}
            </p>
            <button type="button" className="text-link" onClick={() => setPicked(next.round)}>
              Ver partidos
            </button>
          </>
        ) : null}
        {data.updatedAt ? (
          <p className="meta">Datos al {formatUpdatedStamp(data.updatedAt)}.</p>
        ) : null}
      </aside>
    </div>
  );
}

function ScoreRow({
  data,
  match,
  focusId,
  onFocus,
  note,
}: {
  data: PlayoffSnapshot;
  match: MatchRow;
  focusId: string | null;
  onFocus: (id: string) => void;
  note?: string;
}) {
  const home = teamById(data, match.homeId);
  const away = teamById(data, match.awayId);
  const status = matchStatus(match);
  const followed = focusId === match.homeId || focusId === match.awayId;
  return (
    <li className={`score-row${followed ? " is-followed" : ""}`}>
      <Side team={home} align="home" focusId={focusId} onFocus={onFocus} />
      <div className="score-box num">{status.score ?? "–"}</div>
      <Side team={away} align="away" focusId={focusId} onFocus={onFocus} />
      <div className={`score-state${status.live ? " is-live" : ""}`}>
        <span>{status.label}</span>
        {note ? <span className="score-note">{note}</span> : null}
      </div>
    </li>
  );
}

function Side({
  team,
  align,
  focusId,
  onFocus,
}: {
  team: StandingRow | undefined;
  align: "home" | "away";
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  if (!team) {
    return (
      <div className={`score-side is-${align}`}>
        <span className="team-name">A definir</span>
      </div>
    );
  }
  return (
    <div className={`score-side is-${align}`}>
      <button
        type="button"
        className="team-button"
        aria-pressed={focusId === team.id}
        onClick={() => onFocus(team.id)}
      >
        <TeamMark team={team} size={22} />
        <span className="team-name">{team.short}</span>
        {focusId === team.id ? <span className="you-tag">Tu equipo</span> : null}
      </button>
    </div>
  );
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d={dir === "prev" ? "M11.5 3.5 L5.5 9 L11.5 14.5" : "M6.5 3.5 L12.5 9 L6.5 14.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function lastResult(data: PlayoffSnapshot, focusId: string | null): MatchRow | null {
  if (!focusId) return null;
  const seen = new Set<string>();
  const rows = [...(data.calendar ?? []), ...data.matches].filter((match) => {
    if (match.state !== "post") return false;
    if (match.homeId !== focusId && match.awayId !== focusId) return false;
    const key = `${match.homeId}-${match.awayId}-${match.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows[0] ?? null;
}

function factLine(team: StandingRow, match: MatchRow, data: PlayoffSnapshot): string {
  const home = match.homeId === team.id;
  const ours = home ? match.homeScore : match.awayScore;
  const theirs = home ? match.awayScore : match.homeScore;
  const rival = teamById(data, home ? match.awayId : match.homeId);
  return `${team.short} ${ours}–${theirs} ante ${rival?.short ?? "su rival"}.`;
}
