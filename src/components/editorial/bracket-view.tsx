import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { TeamMark } from "@/components/team-mark";
import {
  BRACKET_EDGES,
  BRACKET_GRAPH,
  possiblePath,
  roundSlotIds,
  type BracketRound,
} from "@/lib/playoffs/bracket-graph";
import { matchStatus, teamById, withTodayMatches } from "@/lib/playoffs/format";
import type { KnockoutMatch, PlayoffSnapshot, StandingRow } from "@/lib/playoffs/types";

const ROUNDS: { id: BracketRound; label: string }[] = [
  { id: "octavos", label: "Octavos" },
  { id: "cuartos", label: "Cuartos" },
  { id: "semis", label: "Semis" },
  { id: "final", label: "Final" },
];

function affectedNodes(seeds: Set<string>): Set<string> {
  const nodes = new Set(seeds);
  let grew = true;
  while (grew) {
    grew = false;
    for (const edge of BRACKET_EDGES) {
      if (edge.from.some((id) => nodes.has(id)) && !nodes.has(edge.to)) {
        nodes.add(edge.to);
        grew = true;
      }
    }
  }
  return nodes;
}

type Anchor = { left: number; right: number; cy: number };

function anchorOf(root: HTMLElement, id: string): Anchor | null {
  const node = root.querySelector<HTMLElement>(`[data-node="${id}"]`);
  if (!node) return null;
  const base = root.getBoundingClientRect();
  const box = node.getBoundingClientRect();
  return {
    left: box.left - base.left,
    right: box.right - base.left,
    cy: box.top - base.top + box.height / 2,
  };
}

function linkPath(from: Anchor[], to: Anchor, direction: "ltr" | "rtl"): string {
  const [first, second] = from;
  if (!first) return "";
  if (!second) {
    const x1 = direction === "ltr" ? first.right : first.left;
    const x2 = direction === "ltr" ? to.left : to.right;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${first.cy} H ${mid} V ${to.cy} H ${x2}`;
  }
  const x1 = direction === "ltr" ? first.right : first.left;
  const x2 = direction === "ltr" ? to.left : to.right;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${first.cy} H ${mid} V ${second.cy} M ${x1} ${second.cy} H ${mid} M ${mid} ${to.cy} H ${x2}`;
}

export function BracketView({
  data,
  focusId,
  onFocus,
  changedIds,
  showingPrediction,
  presentation,
  onPresentation,
  scenario,
}: {
  data: PlayoffSnapshot;
  focusId: string | null;
  onFocus: (id: string) => void;
  changedIds: Set<string>;
  showingPrediction: boolean;
  presentation: "llave" | "lista";
  onPresentation: (value: "llave" | "lista") => void;
  scenario?: ReactNode;
}) {
  const [round, setRound] = useState<BracketRound>("octavos");
  const [pathTeam, setPathTeam] = useState<string | null>(null);

  const path = useMemo(
    () => (pathTeam ? new Set(possiblePath(pathTeam, data.octavos)) : new Set<string>()),
    [pathTeam, data.octavos],
  );
  const marked = useMemo(() => {
    const seeds = new Set<string>();
    if (showingPrediction) changedIds.forEach((id) => seeds.add(id));
    path.forEach((id) => seeds.add(id));
    return affectedNodes(seeds);
  }, [showingPrediction, changedIds, path]);

  return (
    <section>
      {showingPrediction ? (
        <p className="banner">
          <strong>Simulación.</strong> El camino marcado es posible con los resultados que cargaste.
          No es un partido jugado.
        </p>
      ) : null}
      {pathTeam ? (
        <p className="banner">
          Camino posible de tu equipo. Las fases siguientes siguen a definir.
        </p>
      ) : null}

      <HoyStrip data={data} />

      <div className="bracket-toolbar">
        {scenario}
        <div className="view-switch" role="group" aria-label="Presentación de los cruces">
          <button type="button" aria-pressed={presentation === "llave"} onClick={() => onPresentation("llave")}>Llave</button>
          <span className="switch-slash" aria-hidden>/</span>
          <button type="button" aria-pressed={presentation === "lista"} onClick={() => onPresentation("lista")}>Lista</button>
        </div>
      </div>
      {presentation === "llave" ? <p className="bracket-hint">Seguí un equipo tocando su nombre. En pantallas chicas, deslizá para recorrer la llave.</p> : null}

      {presentation === "llave" ? (
        <div className="bracket-scroll" tabIndex={0} role="region" aria-label="Llave completa, desplazable horizontalmente">
          <TournamentBracket
            data={data}
            focusId={focusId}
            onFocus={onFocus}
            marked={marked}
            changedIds={changedIds}
          />
        </div>
      ) : (
        <>
          <div className="section-head">
            <h2 className="section-title">{ROUNDS.find((item) => item.id === round)?.label}</h2>
            <button type="button" className="text-link" onClick={() => onPresentation("llave")}>
              Ver llave completa
            </button>
          </div>
          <RoundList
            data={data}
            round={round}
            onRound={setRound}
            focusId={focusId}
            onFocus={onFocus}
            changedIds={changedIds}
            pathTeam={pathTeam}
            onPath={setPathTeam}
          />
        </>
      )}


      <div className="rules">
        <div>
          <h2>Octavos</h2>
          <p>
            Clasifican los 8 primeros de cada zona. Partido único: 1°A vs 8°B, 1°B vs 8°A, y así
            hasta 4° vs 5°. Localía en el estadio del mejor ubicado.
          </p>
        </div>
        <div>
          <h2>Camino a la final</h2>
          <p>
            Cuartos: P1–P8, P4–P5, P2–P7 y P3–P6. Semis: C1–C4 y C2–C3. Final en sede de la LPF. Si
            hay empate a los 90, alargue de 30 y penales.
          </p>
        </div>
        <div>
          <h2>La tabla</h2>
          <p>
            El orden sale del desempate del torneo: diferencia de gol, goles a favor, partidos entre
            sí, fair play y sorteo. Un club en zona de descenso en el Clausura no puede jugar el
            mata-mata.
          </p>
        </div>
      </div>

      <h2 className="sr-only">Partidos de la llave</h2>
      <ol className="sr-only">
        {data.octavos.map((match) => (
          <li key={match.id}>
            {match.label}. {match.note}. {match.home.team?.name ?? "A definir"} contra{" "}
            {match.away.team?.name ?? "A definir"}. {match.homeAdvantage}.
          </li>
        ))}
        {data.cuartos.map((match) => (
          <li key={match.id}>{match.label}. A definir.</li>
        ))}
        {data.semis.map((match) => (
          <li key={match.id}>{match.label}. A definir.</li>
        ))}
        <li>Final. A definir. {data.finalNote}</li>
      </ol>
    </section>
  );
}

function RoundList({
  data,
  round,
  onRound,
  focusId,
  onFocus,
  changedIds,
  pathTeam,
  onPath,
}: {
  data: PlayoffSnapshot;
  round: BracketRound;
  onRound: (round: BracketRound) => void;
  focusId: string | null;
  onFocus: (id: string) => void;
  changedIds: Set<string>;
  pathTeam: string | null;
  onPath: (id: string | null) => void;
}) {
  const baseId = useId();
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = ROUNDS.findIndex((item) => item.id === round);
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? ROUNDS.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % ROUNDS.length
            : (index - 1 + ROUNDS.length) % ROUNDS.length;
    const id = ROUNDS[next]?.id;
    if (!id) return;
    onRound(id);
    document.getElementById(`${baseId}-${id}`)?.focus();
  };

  const ids = roundSlotIds(round);
  const byId = new Map(data.octavos.map((match) => [match.id, match]));

  return (
    <div>
      <div className="round-tabs" role="tablist" aria-label="Rondas" onKeyDown={onKey}>
        {ROUNDS.map((item) => (
          <button
            key={item.id}
            id={`${baseId}-${item.id}`}
            type="button"
            role="tab"
            aria-selected={round === item.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={round === item.id ? 0 : -1}
            onClick={() => onRound(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-${round}`} className="round-list two">
        {ids.length === 0 ? <p className="meta">Todavía no hay cruces en esta ronda.</p> : null}
        {ids.map((id) => {
          const octavos = byId.get(id);
          if (octavos) {
            return (
              <OctavosCard
                key={id}
                match={octavos}
                focusId={focusId}
                onFocus={onFocus}
                changed={changedIds.has(id)}
                pathTeam={pathTeam}
                onPath={onPath}
              />
            );
          }
          return (
            <article key={id} className="round-match">
              <SlotLine name="A definir" />
              <div className="slot-rule" />
              <SlotLine name="A definir" />
              <p className="venue-line">Sede a confirmar</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OctavosCard({
  match,
  focusId,
  onFocus,
  changed,
  pathTeam,
  onPath,
}: {
  match: KnockoutMatch;
  focusId: string | null;
  onFocus: (id: string) => void;
  changed: boolean;
  pathTeam: string | null;
  onPath: (id: string | null) => void;
}) {
  const stadium = match.homeAdvantage.replace(/^Local en\s+/i, "");
  const involved = [match.home.team, match.away.team].filter((team): team is StandingRow => Boolean(team));
  const followed = involved.find((team) => team.id === focusId);
  return (
    <article className="round-match">
      <TeamSlot team={match.home.team} seed={match.home.seed} zone={match.home.zone} focusId={focusId} onFocus={onFocus} />
      <div className="slot-rule" />
      <TeamSlot team={match.away.team} seed={match.away.seed} zone={match.away.zone} focusId={focusId} onFocus={onFocus} />
      <p className="venue-line">{stadium}</p>
      {changed ? <p className="changed-tag">Distinto en tu simulación</p> : null}
      {followed ? (
        <button
          type="button"
          className="text-link"
          onClick={() => onPath(pathTeam === followed.id ? null : followed.id)}
        >
          {pathTeam === followed.id ? "Ocultar camino" : "Ver camino a la final"}
        </button>
      ) : null}
    </article>
  );
}

function SlotLine({ name }: { name: string }) {
  return (
    <div className="team-slot">
      <TeamMark team={null} size={28} />
      <span className="team-name">{name}</span>
    </div>
  );
}

function TeamSlot({
  team,
  seed,
  zone,
  focusId,
  onFocus,
  side,
  size = 28,
}: {
  team: StandingRow | null;
  seed?: number;
  zone?: string;
  focusId: string | null;
  onFocus: (id: string) => void;
  side?: "left" | "right";
  size?: number;
}) {
  const followed = Boolean(team && team.id === focusId);
  const name = team?.short ?? "A definir";
  return (
    <div className={`team-slot${followed ? " is-followed" : ""}`} data-side={side}>
      {team ? (
        <button
          type="button"
          className="team-button"
          aria-pressed={followed}
          onClick={() => onFocus(team.id)}
        >
          <TeamMark team={team} size={size} />
          <span className="team-copy">
            <span className="team-name">{name}</span>
            {followed ? <span className="you-tag">Tu equipo</span> : null}
            <span className="meta num">{team.pts} pts</span>
          </span>
        </button>
      ) : (
        <span className="team-copy">
          <span className="team-name">A definir</span>
          {seed && zone ? (
            <span className="origin">
              {seed}° Zona {zone}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

function HoyStrip({ data }: { data: PlayoffSnapshot }) {
  const matches = useMemo(
    () => withTodayMatches([], [...(data.calendar ?? []), ...data.matches, ...data.remaining]),
    [data.calendar, data.matches, data.remaining],
  );
  if (matches.length === 0) return null;
  return (
    <section className="hoy-strip" aria-label="Partidos de hoy">
      <h2>HOY</h2>
      <ul>
        {matches.map((match) => {
          const status = matchStatus(match);
          return (
            <li key={match.id}>
              <span>{teamById(data, match.homeId)?.short ?? "Local"}</span>
              <span className="num">{status.score ?? "–"}</span>
              <span>{teamById(data, match.awayId)?.short ?? "Visita"}</span>
              <span className={status.live ? "live-word" : "meta"}>{status.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CupMark() {
  const [ready, setReady] = useState(true);
  if (!ready) return <p className="cup-pending">Copa de la Liga Profesional</p>;
  return (
    <img
      className="cup"
      src="/brand/copa-lpf.png"
      alt="Copa de la Liga Profesional"
      onError={() => setReady(false)}
    />
  );
}

function TournamentBracket({
  data,
  focusId,
  onFocus,
  marked,
  changedIds,
}: {
  data: PlayoffSnapshot;
  focusId: string | null;
  onFocus: (id: string) => void;
  marked: Set<string>;
  changedIds: Set<string>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<{ id: string; d: string; dashed: boolean }[]>([]);
  const signature = `${data.updatedAt}|${focusId ?? ""}|${[...marked].join(",")}|${data.octavos
    .map((match) => `${match.id}${match.home.team?.id ?? ""}${match.away.team?.id ?? ""}`)
    .join("|")}`;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const draw = () => {
      const next: { id: string; d: string; dashed: boolean }[] = [];
      for (const edge of BRACKET_EDGES) {
        const from = edge.from
          .map((id) => anchorOf(root, id))
          .filter((item): item is Anchor => Boolean(item));
        const to = anchorOf(root, edge.to);
        if (!to || from.length !== edge.from.length) continue;
        const dashed = edge.from.some((id) => marked.has(id)) && marked.has(edge.to);
        next.push({ id: edge.id, d: linkPath(from, to, edge.direction), dashed });
      }
      setLinks(next);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(root);
    return () => observer.disconnect();
  }, [signature, marked]);

  const byId = new Map(data.octavos.map((match) => [match.id, match]));
  const cell = (column: number, row: number, span = 1): CSSProperties => ({
    gridColumn: column,
    gridRow: span === 1 ? row : `${row} / span ${span}`,
    alignSelf: "center",
  });

  return (
    <div className="bracket-stage">
      <div className="bracket-labels" aria-hidden>
        {["Octavos", "Cuartos", "Semis", "Final", "Semis", "Cuartos", "Octavos"].map((label, index) => (
          <p key={`${label}-${index}`} className="round-label" style={{ gridColumn: index * 2 + 1 }}>
            {label}
          </p>
        ))}
      </div>
      <div className="bracket-grid" ref={rootRef}>
        <svg className="bracket-links" aria-hidden="true">
          {links.map((link) => (
            <path
              key={link.id}
              d={link.d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeDasharray={link.dashed ? "5 4" : undefined}
            />
          ))}
        </svg>
        {BRACKET_GRAPH.left.octavos.map((id, index) => (
          <div key={id} className="bracket-cell" style={cell(1, index + 1)}>
            <OctavosNode
              match={byId.get(id)}
              side="left"
              focusId={focusId}
              onFocus={onFocus}
              changed={changedIds.has(id)}
            />
          </div>
        ))}
        {BRACKET_GRAPH.left.quarters.map((slot, index) => (
          <div key={slot.id} className="bracket-cell" style={cell(3, index * 2 + 1, 2)}>
            <LaterNode id={slot.id} />
          </div>
        ))}
        <div className="bracket-cell" style={cell(5, 1, 4)}>
          <LaterNode id={BRACKET_GRAPH.left.semi.id} />
        </div>
        <div className="final-cell">
          <CupMark />
          <LaterNode id="F" />
        </div>
        <div className="bracket-cell" style={{ ...cell(9, 1, 4), justifyContent: "flex-end" }}>
          <LaterNode id={BRACKET_GRAPH.right.semi.id} />
        </div>
        {BRACKET_GRAPH.right.quarters.map((slot, index) => (
          <div key={slot.id} className="bracket-cell" style={{ ...cell(11, index * 2 + 1, 2), justifyContent: "flex-end" }}>
            <LaterNode id={slot.id} />
          </div>
        ))}
        {BRACKET_GRAPH.right.octavos.map((id, index) => (
          <div key={id} className="bracket-cell" style={{ ...cell(13, index + 1), justifyContent: "flex-end" }}>
            <OctavosNode
              match={byId.get(id)}
              side="right"
              focusId={focusId}
              onFocus={onFocus}
              changed={changedIds.has(id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function OctavosNode({
  match,
  side,
  focusId,
  onFocus,
  changed,
}: {
  match: KnockoutMatch | undefined;
  side: "left" | "right";
  focusId: string | null;
  onFocus: (id: string) => void;
  changed: boolean;
}) {
  if (!match) return null;
  return (
    <div className="match-node" data-node={match.id}>
      <TeamSlot
        team={match.home.team}
        seed={match.home.seed}
        zone={match.home.zone}
        side={side}
        size={22}
        focusId={focusId}
        onFocus={onFocus}
      />
      <div className="slot-rule" />
      <TeamSlot
        team={match.away.team}
        seed={match.away.seed}
        zone={match.away.zone}
        side={side}
        size={22}
        focusId={focusId}
        onFocus={onFocus}
      />
      {changed ? <p className="changed-tag">Posible</p> : null}
    </div>
  );
}

function LaterNode({ id }: { id: string }) {
  return (
    <div className="match-node" data-node={id}>
      <div className="team-slot">
        <span className="team-name">A definir</span>
      </div>
      <div className="slot-rule" />
      <div className="team-slot">
        <span className="team-name">A definir</span>
      </div>
    </div>
  );
}
