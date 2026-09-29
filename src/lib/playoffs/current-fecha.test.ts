import assert from "node:assert/strict";
import test from "node:test";
import { selectFecha } from "./current-fecha.ts";
import type { MatchRow } from "./types.ts";

function match(partial: Pick<MatchRow, "id" | "date" | "state"> & { round: number }): MatchRow {
  return {
    venue: "",
    clock: "",
    homeId: "1",
    awayId: "2",
    homeScore: 0,
    awayScore: 0,
    counted: partial.state === "post",
    projected: false,
    ...partial,
  };
}

const fecha11 = [
  match({ id: "a", round: 11, date: "2026-10-02T22:15:00Z", state: "pre" }),
  match({ id: "b", round: 11, date: "2026-10-04T20:00:00Z", state: "pre" }),
  match({ id: "c", round: 11, date: "2026-10-06T00:15:00Z", state: "pre" }),
  match({ id: "late", round: 11, date: "2026-10-14T22:00:00Z", state: "pre" }),
];
const fecha12 = [
  match({ id: "d", round: 12, date: "2026-10-09T21:00:00Z", state: "pre" }),
  match({ id: "e", round: 12, date: "2026-10-12T21:30:00Z", state: "pre" }),
];

test("before the weekend, the board is the whole next fecha", () => {
  const selected = selectFecha([...fecha11, ...fecha12], Date.parse("2026-09-28T15:00:00Z"));
  assert.equal(selected.round, 11);
  assert.deepEqual(selected.matches.map((item) => item.id), ["a", "b", "c", "late"]);
});

test("a fecha stays up the night its last match finishes", () => {
  const done = fecha11.map((item) =>
    item.id === "late" ? item : { ...item, state: "post" as const },
  );
  const night = selectFecha([...done, ...fecha12], Date.parse("2026-10-06T02:00:00Z"));
  assert.equal(night.round, 11);
  const morning = selectFecha([...done, ...fecha12], Date.parse("2026-10-06T12:00:00Z"));
  assert.equal(morning.round, 12);
  assert.deepEqual(morning.matches.map((item) => item.id), ["d", "e"]);
});

test("a postponed match does not keep the previous fecha on the board", () => {
  const done = fecha11.map((item) =>
    item.id === "late" ? item : { ...item, state: "post" as const },
  );
  const selected = selectFecha([...done, ...fecha12], Date.parse("2026-10-10T18:00:00Z"));
  assert.equal(selected.round, 12);
});
