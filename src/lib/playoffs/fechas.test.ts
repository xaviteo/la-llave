import assert from "node:assert/strict";
import test from "node:test";
import { fechaBoards, matchStatus, seasonLine } from "./format.ts";
import { readGoal } from "./scores.ts";
import type { MatchRow, RemainingMatch } from "./types.ts";

function match(partial: Partial<MatchRow> & Pick<MatchRow, "id" | "homeId" | "awayId">): MatchRow {
  return {
    date: "",
    venue: "",
    state: "pre",
    clock: "",
    homeScore: 0,
    awayScore: 0,
    counted: false,
    projected: false,
    ...partial,
  };
}

test("the season line uses the tournament year", () => {
  assert.equal(seasonLine("Torneo Clausura 2026", "el camino a la final."), "Clausura 2026 — el camino a la final.");
  assert.equal(seasonLine("Torneo Apertura 2025", "posiciones por zona."), "Apertura 2025 — posiciones por zona.");
});

test("an empty score is not zero", () => {
  assert.equal(readGoal(""), null);
  assert.equal(readGoal("  "), null);
  assert.equal(readGoal("0"), 0);
  assert.equal(readGoal("12"), 2);
});

test("a scheduled match does not invent a 0-0", () => {
  const status = matchStatus(match({ id: "a", homeId: "1", awayId: "2", date: "2026-10-18T19:00:00Z" }));
  assert.equal(status.score, null);
  assert.notEqual(status.label, "0–0");
});

test("fecha boards keep one row per pairing and prefer the played match", () => {
  const calendar = [
    match({
      id: "espn-1",
      homeId: "4",
      awayId: "15",
      round: 13,
      date: "2026-10-18T19:00:00Z",
      state: "post",
      homeScore: 2,
      awayScore: 1,
    }),
  ];
  const remaining = [
    match({
      id: "r13-4-15",
      homeId: "4",
      awayId: "15",
      round: 13,
      state: "pre",
    }),
    match({
      id: "r14-5-16",
      homeId: "5",
      awayId: "16",
      round: 14,
      date: "2026-10-25T19:00:00Z",
    }),
  ] as RemainingMatch[];
  const boards = fechaBoards(calendar, remaining);
  assert.deepEqual(
    boards.map((board) => board.round),
    [13, 14],
  );
  assert.equal(boards[0]?.matches.length, 1);
  assert.equal(boards[0]?.matches[0]?.id, "espn-1");
  assert.equal(boards[0]?.matches[0]?.homeScore, 2);
});
