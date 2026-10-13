import { LLAVE_1, LLAVE_2 } from "./logic.ts";
import type { KnockoutMatch, PlayoffSnapshot } from "./types";

/**
 * Visual slots for the real knockout graph.
 * Pairings come from LLAVE_1 / LLAVE_2 and the quarter definitions in buildSnapshot.
 * Left feeds the final from the right edge of each match. Right feeds it from the left.
 */
export const BRACKET_GRAPH = {
  left: {
    octavos: LLAVE_1,
    quarters: [
      { id: "C1", sources: ["P1", "P8"] },
      { id: "C4", sources: ["P4", "P5"] },
    ],
    semi: { id: "S1", sources: ["C1", "C4"] },
  },
  right: {
    octavos: LLAVE_2,
    quarters: [
      { id: "C2", sources: ["P2", "P7"] },
      { id: "C3", sources: ["P3", "P6"] },
    ],
    semi: { id: "S2", sources: ["C2", "C3"] },
  },
  final: { id: "F", sources: ["S1", "S2"] },
} as const;

export type BracketEdge = {
  id: string;
  from: readonly string[];
  to: string;
  direction: "ltr" | "rtl";
};

export const BRACKET_EDGES: readonly BracketEdge[] = [
  { id: "e-c1", from: ["P1", "P8"], to: "C1", direction: "ltr" },
  { id: "e-c4", from: ["P4", "P5"], to: "C4", direction: "ltr" },
  { id: "e-s1", from: ["C1", "C4"], to: "S1", direction: "ltr" },
  { id: "e-f1", from: ["S1"], to: "F", direction: "ltr" },
  { id: "e-c2", from: ["P2", "P7"], to: "C2", direction: "rtl" },
  { id: "e-c3", from: ["P3", "P6"], to: "C3", direction: "rtl" },
  { id: "e-s2", from: ["C2", "C3"], to: "S2", direction: "rtl" },
  { id: "e-f2", from: ["S2"], to: "F", direction: "rtl" },
];

export type BracketRound = "octavos" | "cuartos" | "semis" | "final";

export function roundSlotIds(round: BracketRound): string[] {
  if (round === "octavos") return [...BRACKET_GRAPH.left.octavos, ...BRACKET_GRAPH.right.octavos];
  if (round === "cuartos") {
    return [
      ...BRACKET_GRAPH.left.quarters.map((slot) => slot.id),
      ...BRACKET_GRAPH.right.quarters.map((slot) => slot.id),
    ];
  }
  if (round === "semis") return [BRACKET_GRAPH.left.semi.id, BRACKET_GRAPH.right.semi.id];
  return [BRACKET_GRAPH.final.id];
}

export function slotDetail(data: PlayoffSnapshot, id: string): [string, string] {
  if (id === "F") return ["Ganador S1", "Ganador S2"];
  const quarter = data.cuartos.find((item) => item.id === id);
  if (quarter) return [quarter.a, quarter.b];
  const semi = data.semis.find((item) => item.id === id);
  if (semi) return [semi.a, semi.b];
  return ["A definir", "A definir"];
}

/** Possible route if this team keeps advancing. It is not a result. */
export function possiblePath(teamId: string, octavos: KnockoutMatch[]): string[] {
  const match = octavos.find(
    (item) => item.home.team?.id === teamId || item.away.team?.id === teamId,
  );
  if (!match) return [];
  const sides = [BRACKET_GRAPH.left, BRACKET_GRAPH.right] as const;
  for (const side of sides) {
    if (!(side.octavos as readonly string[]).includes(match.id)) continue;
    const quarter = side.quarters.find((slot) => (slot.sources as readonly string[]).includes(match.id));
    return [match.id, quarter?.id ?? "", side.semi.id, BRACKET_GRAPH.final.id].filter(Boolean);
  }
  return [match.id];
}

export function bracketCounts(octavos: KnockoutMatch[]) {
  const left = BRACKET_GRAPH.left.octavos.filter((id) => octavos.some((match) => match.id === id));
  const right = BRACKET_GRAPH.right.octavos.filter((id) => octavos.some((match) => match.id === id));
  return {
    octavos: left.length + right.length,
    cuartos: BRACKET_GRAPH.left.quarters.length + BRACKET_GRAPH.right.quarters.length,
    semis: 2,
    final: 1,
    leftTeams: left.length * 2,
    rightTeams: right.length * 2,
  };
}
