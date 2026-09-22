import { fixtureId, REMAINING_FIXTURE } from "./fixture";
import { teamMeta } from "./teams";
import type {
  BracketSide,
  KnockoutMatch,
  MatchRow,
  MatchState,
  PlayoffSnapshot,
  PredictionMap,
  RemainingMatch,
  StandingRow,
  ZoneId,
} from "./types";

export type RawStanding = {
  id: string;
  zone: ZoneId;
  name: string;
  short: string;
  abbr: string;
  logo: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  pts: number;
  rank: number;
};

export type RawMatch = {
  id: string;
  date: string;
  venue: string;
  state: MatchState;
  clock: string;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  homeRecord?: string;
  awayRecord?: string;
};

function decorate(raw: RawStanding, projected: boolean): StandingRow {
  const meta = teamMeta(raw.id, raw.short);
  return {
    ...raw,
    short: meta.short,
    stadium: meta.stadium,
    color: meta.color,
    position: raw.rank || 0,
    projected,
  };
}

function gd(row: StandingRow): number {
  return row.gf - row.ga;
}

function sortOfficial(rows: StandingRow[]): StandingRow[] {
  return [...rows]
    .sort((a, b) => {
      if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
      return (
        b.pts - a.pts ||
        gd(b) - gd(a) ||
        b.gf - a.gf ||
        b.wins - a.wins ||
        a.name.localeCompare(b.name, "es")
      );
    })
    .map((row, i) => ({ ...row, position: i + 1 }));
}

function sortProjected(rows: StandingRow[]): StandingRow[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        gd(b) - gd(a) ||
        b.gf - a.gf ||
        b.wins - a.wins ||
        a.rank - b.rank ||
        a.name.localeCompare(b.name, "es"),
    )
    .map((row, i) => ({ ...row, position: i + 1 }));
}

function cloneRows(rows: StandingRow[]): StandingRow[] {
  return rows.map((row) => ({ ...row }));
}

function findTeam(zones: { A: StandingRow[]; B: StandingRow[] }, id: string) {
  for (const zone of ["A", "B"] as const) {
    const index = zones[zone].findIndex((row) => row.id === id);
    if (index >= 0) return { zone, index, team: zones[zone][index] };
  }
  return null;
}

function applyOutcome(
  team: StandingRow,
  scored: number,
  conceded: number,
  markProjected = true,
) {
  team.played += 1;
  team.gf += scored;
  team.ga += conceded;
  if (markProjected) team.projected = true;
  if (scored > conceded) {
    team.wins += 1;
    team.pts += 3;
  } else if (scored === conceded) {
    team.draws += 1;
    team.pts += 1;
  } else {
    team.losses += 1;
  }
}

function recordsMatch(row: StandingRow, summary?: string): boolean {
  if (!summary) return true;
  const parts = summary.split("-").map((n) => Number.parseInt(n, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return true;
  const [w, d, l] = parts;
  return row.wins === w && row.draws === d && row.losses === l;
}

export function projectStandings(
  official: { A: StandingRow[]; B: StandingRow[] },
  matches: MatchRow[],
): { zones: { A: StandingRow[]; B: StandingRow[] }; matches: MatchRow[] } {
  const zones = { A: cloneRows(official.A), B: cloneRows(official.B) };
  const nextMatches = matches.map((match) => ({ ...match }));

  for (const match of nextMatches) {
    const home = findTeam(zones, match.homeId);
    const away = findTeam(zones, match.awayId);
    if (!home || !away) continue;

    if (match.state === "in") {
      applyOutcome(home.team, match.homeScore, match.awayScore);
      applyOutcome(away.team, match.awayScore, match.homeScore);
      match.projected = true;
      match.counted = false;
    } else if (match.state === "post") {
      const alreadyIn =
        recordsMatch(home.team, match.homeRecord) &&
        recordsMatch(away.team, match.awayRecord);
      if (!alreadyIn) {
        applyOutcome(home.team, match.homeScore, match.awayScore);
        applyOutcome(away.team, match.awayScore, match.homeScore);
        match.projected = true;
        match.counted = false;
      } else {
        match.counted = true;
      }
    }
  }

  return {
    zones: {
      A: sortProjected(zones.A),
      B: sortProjected(zones.B),
    },
    matches: nextMatches,
  };
}

function side(team: StandingRow, seed: number): BracketSide {
  return { team, seed, zone: team.zone };
}

function emptySide(seed: number, zone: ZoneId): BracketSide {
  return { team: null, seed, zone };
}

function octavosMatch(
  id: number,
  home: StandingRow | undefined,
  away: StandingRow | undefined,
  homeSeed: number,
  awaySeed: number,
  homeZone: ZoneId,
  awayZone: ZoneId,
): KnockoutMatch {
  const homeSide = home ? side(home, homeSeed) : emptySide(homeSeed, homeZone);
  const awaySide = away ? side(away, awaySeed) : emptySide(awaySeed, awayZone);
  const stadium = home?.stadium ?? "estadio del mejor ubicado";
  return {
    id: `P${id}`,
    round: "octavos",
    label: `Partido ${id}`,
    home: homeSide,
    away: awaySide,
    homeAdvantage: `Local en ${stadium}`,
    note: `${homeSeed}° Zona ${homeZone} vs ${awaySeed}° Zona ${awayZone}`,
  };
}

export function buildOctavos(A: StandingRow[], B: StandingRow[]): KnockoutMatch[] {
  return [
    octavosMatch(1, A[0], B[7], 1, 8, "A", "B"),
    octavosMatch(2, B[0], A[7], 1, 8, "B", "A"),
    octavosMatch(3, A[1], B[6], 2, 7, "A", "B"),
    octavosMatch(4, B[1], A[6], 2, 7, "B", "A"),
    octavosMatch(5, A[2], B[5], 3, 6, "A", "B"),
    octavosMatch(6, B[2], A[5], 3, 6, "B", "A"),
    octavosMatch(7, A[3], B[4], 4, 5, "A", "B"),
    octavosMatch(8, B[3], A[4], 4, 5, "B", "A"),
  ];
}

export function buildSnapshot(input: {
  tournament: string;
  rawStandings: RawStanding[];
  rawMatches: RawMatch[];
  source: "espn" | "fallback";
  updatedAt?: string;
}): PlayoffSnapshot {
  const official = {
    A: sortOfficial(
      input.rawStandings.filter((row) => row.zone === "A").map((row) => decorate(row, false)),
    ),
    B: sortOfficial(
      input.rawStandings.filter((row) => row.zone === "B").map((row) => decorate(row, false)),
    ),
  };

  const baseMatches: MatchRow[] = input.rawMatches.map((match) => ({
    id: match.id,
    date: match.date,
    venue: match.venue,
    state: match.state,
    clock: match.clock,
    homeId: match.homeId,
    awayId: match.awayId,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    counted: match.state === "post",
    projected: false,
    homeRecord: match.homeRecord,
    awayRecord: match.awayRecord,
  }));

  const projected = projectStandings(official, baseMatches);
  const useProjected = projected.matches.some((match) => match.projected);
  const zones = useProjected ? projected.zones : official;
  const octavos = buildOctavos(zones.A, zones.B);
  const maxPlayed = Math.max(0, ...official.A.concat(official.B).map((row) => row.played));

  const snapshot: PlayoffSnapshot = {
    tournament: input.tournament,
    roundLabel: maxPlayed > 0 ? `Fecha ${maxPlayed}` : "Fase de zonas",
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    source: input.source,
    live: projected.matches.some((match) => match.state === "in"),
    projected: useProjected,
    zones,
    matches: projected.matches.sort((a, b) => a.date.localeCompare(b.date)),
    octavos,
    remaining: [],
    cuartos: [
      { id: "C1", label: "Cuartos 1", a: "Ganador P1", b: "Ganador P8" },
      { id: "C2", label: "Cuartos 2", a: "Ganador P2", b: "Ganador P7" },
      { id: "C3", label: "Cuartos 3", a: "Ganador P3", b: "Ganador P6" },
      { id: "C4", label: "Cuartos 4", a: "Ganador P4", b: "Ganador P5" },
    ],
    semis: [
      { id: "S1", label: "Semifinal 1", a: "Ganador C1", b: "Ganador C4" },
      { id: "S2", label: "Semifinal 2", a: "Ganador C2", b: "Ganador C3" },
    ],
    finalNote:
      "La final es a partido único en sede de la LPF. En octavos, cuartos y semis, localía para el mejor de la fase de zonas. Empate: alargue y penales.",
  };

  return attachRemaining(snapshot, input.rawMatches);
}

export function attachRemaining(
  snapshot: PlayoffSnapshot,
  live: RawMatch[],
): PlayoffSnapshot {
  const liveByPair = new Map<string, RawMatch>();
  for (const match of live) {
    liveByPair.set(`${match.homeId}-${match.awayId}`, match);
  }

  const remaining: RemainingMatch[] = [];
  for (const game of REMAINING_FIXTURE) {
    const id = fixtureId(game);
    const liveMatch = liveByPair.get(`${game.homeId}-${game.awayId}`);
    if (game.round <= 10 && !liveMatch) continue;
    const state: MatchState = liveMatch?.state ?? "pre";
    if (state === "post") continue;
    remaining.push({
      id,
      date: liveMatch?.date ?? "",
      venue: liveMatch?.venue ?? "",
      state,
      clock: liveMatch?.clock ?? "",
      homeId: game.homeId,
      awayId: game.awayId,
      homeScore: liveMatch?.homeScore ?? 0,
      awayScore: liveMatch?.awayScore ?? 0,
      counted: false,
      projected: state === "in",
      round: game.round,
      label: game.label,
    });
  }

  return { ...snapshot, remaining };
}

export function applyPredictedResults(
  zones: { A: StandingRow[]; B: StandingRow[] },
  remaining: RemainingMatch[],
  predictions: PredictionMap,
): { A: StandingRow[]; B: StandingRow[] } {
  const next = { A: cloneRows(zones.A), B: cloneRows(zones.B) };
  for (const match of remaining) {
    if (match.state !== "pre") continue;
    const pred = predictions[match.id];
    if (!pred || pred.home === null || pred.away === null) continue;
    const home = findTeam(next, match.homeId);
    const away = findTeam(next, match.awayId);
    if (!home || !away) continue;
    applyOutcome(home.team, pred.home, pred.away, false);
    applyOutcome(away.team, pred.away, pred.home, false);
  }
  return { A: sortProjected(next.A), B: sortProjected(next.B) };
}

export function snapshotWithPredictions(
  snapshot: PlayoffSnapshot,
  predictions: PredictionMap,
): PlayoffSnapshot {
  const count = snapshot.remaining.filter((match) => {
    const pred = predictions[match.id];
    return match.state === "pre" && pred?.home != null && pred.away != null;
  }).length;
  if (count === 0) return snapshot;
  const zones = applyPredictedResults(snapshot.zones, snapshot.remaining, predictions);
  return {
    ...snapshot,
    zones,
    octavos: buildOctavos(zones.A, zones.B),
  };
}

export function changedMatchIds(from: KnockoutMatch[], to: KnockoutMatch[]): Set<string> {
  const prev = new Map(from.map((match) => [match.id, match]));
  const ids = new Set<string>();
  for (const match of to) {
    const before = prev.get(match.id);
    if (!before) continue;
    if (
      before.home.team?.id !== match.home.team?.id ||
      before.away.team?.id !== match.away.team?.id
    ) {
      ids.add(match.id);
    }
  }
  return ids;
}

export const LLAVE_1 = ["P1", "P8", "P4", "P5"] as const;
export const LLAVE_2 = ["P2", "P7", "P3", "P6"] as const;

export const TREE_ORDER = ["P1", "P8", "P4", "P5", "P2", "P7", "P3", "P6"] as const;

export function matchesByIds(octavos: KnockoutMatch[], ids: readonly string[]) {
  return ids
    .map((id) => octavos.find((match) => match.id === id))
    .filter((match): match is KnockoutMatch => Boolean(match));
}
