import assert from "node:assert/strict";
import test from "node:test";
import { assignRounds } from "./rounds.ts";

test("a postponed pairing falls back into the fecha both clubs skipped", () => {
  const rows = assignRounds([
    { id: "1", date: "2026-10-02T20:00:00Z", homeId: "a", awayId: "b" },
    { id: "2", date: "2026-10-02T22:00:00Z", homeId: "c", awayId: "d" },
    { id: "3", date: "2026-10-11T20:00:00Z", homeId: "a", awayId: "c" },
    { id: "4", date: "2026-10-20T20:00:00Z", homeId: "b", awayId: "d" },
  ]);
  const round = (id: string) => rows.find((row) => row.id === id)?.round;
  assert.equal(round("1"), 1);
  assert.equal(round("2"), 1);
  assert.equal(round("3"), 2);
  assert.equal(round("4"), 2);
});

test("Sarmiento–River stays on fecha 11 even when it is played after fecha 12", () => {
  const rows = assignRounds([
    { id: "f11-other", date: "2026-10-03T20:00:00Z", homeId: "10", awayId: "9739" },
    { id: "f12-sarmiento", date: "2026-10-11T20:00:00Z", homeId: "9739", awayId: "10158" },
    { id: "f12-river", date: "2026-10-11T22:00:00Z", homeId: "16", awayId: "19685" },
    { id: "late", date: "2026-10-14T22:00:00Z", homeId: "10158", awayId: "16" },
  ]);
  const round = (id: string) => rows.find((row) => row.id === id)?.round;
  assert.equal(round("late"), 11);
  assert.equal(round("f12-sarmiento"), 12);
  assert.equal(round("f12-river"), 12);
  assert.equal(round("f11-other"), 11);
});
