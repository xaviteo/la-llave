import assert from "node:assert/strict";
import test from "node:test";
import { BRACKET_EDGES, BRACKET_GRAPH, bracketCounts, possiblePath, slotDetail } from "./bracket-graph.ts";
import { buildSnapshot } from "./logic.ts";
import type { KnockoutMatch, PlayoffSnapshot } from "./types.ts";

test("the bracket is one symmetric graph of 15 matches", () => {
  const snapshot = buildSnapshot({
    tournament: "Torneo Clausura 2026",
    rawStandings: [],
    rawMatches: [],
    source: "fallback",
  });
  const counts = bracketCounts(snapshot.octavos);
  assert.equal(counts.octavos, 8);
  assert.equal(counts.cuartos, 4);
  assert.equal(counts.semis, 2);
  assert.equal(counts.final, 1);
  assert.equal(counts.leftTeams, 8);
  assert.equal(counts.rightTeams, 8);
  assert.equal(counts.octavos + counts.cuartos + counts.semis + counts.final, 15);
});

test("quarter and semi slots follow the regulatory pairings", () => {
  const snapshot = buildSnapshot({
    tournament: "Torneo Clausura 2026",
    rawStandings: [],
    rawMatches: [],
    source: "fallback",
  });
  assert.deepEqual(BRACKET_GRAPH.left.octavos, ["P1", "P8", "P4", "P5"]);
  assert.deepEqual(BRACKET_GRAPH.right.octavos, ["P2", "P7", "P3", "P6"]);
  assert.deepEqual(
    snapshot.cuartos.map((item) => [item.id, item.a, item.b]),
    [
      ["C1", "Ganador P1", "Ganador P8"],
      ["C2", "Ganador P2", "Ganador P7"],
      ["C3", "Ganador P3", "Ganador P6"],
      ["C4", "Ganador P4", "Ganador P5"],
    ],
  );
  assert.deepEqual(slotDetail(snapshot, "C1"), ["Ganador P1", "Ganador P8"]);
  assert.deepEqual(slotDetail(snapshot, "S1"), ["Ganador C1", "Ganador C4"]);
  assert.deepEqual(slotDetail(snapshot, "F"), ["Ganador S1", "Ganador S2"]);
  const targets = new Set(BRACKET_EDGES.map((edge) => edge.to));
  assert.equal(targets.has("F"), true);
  assert.equal(BRACKET_EDGES.filter((edge) => edge.to === "F").length, 2);
});

test("a followed team has one possible path and no invented opponents", () => {
  const match = {
    id: "P1",
    round: "octavos",
    label: "Partido 1",
    home: { team: { id: "4" }, seed: 1, zone: "B" },
    away: { team: { id: "5" }, seed: 8, zone: "A" },
    homeAdvantage: "",
    note: "",
  } as KnockoutMatch;
  assert.deepEqual(possiblePath("4", [match]), ["P1", "C1", "S1", "F"]);
  assert.deepEqual(possiblePath("9", [match]), []);
  const snapshot = { cuartos: [], semis: [] } as unknown as PlayoffSnapshot;
  assert.deepEqual(slotDetail(snapshot, "C1"), ["A definir", "A definir"]);
});
