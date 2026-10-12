import assert from "node:assert/strict";
import test from "node:test";
import { agendaGroups, formatDayHeading } from "./format.ts";
import type { MatchRow } from "./types.ts";

function row(id: string, date: string, state: MatchRow["state"] = "pre"): MatchRow {
  return {
    id,
    date,
    venue: "",
    state,
    clock: "",
    homeId: "1",
    awayId: "2",
    homeScore: 0,
    awayScore: 0,
    counted: state === "post",
    projected: false,
  };
}

const NOON = Date.parse("2026-10-12T15:00:00.000Z");
const TONIGHT = "2026-10-13T01:00:00.000Z";
const AFTER_MIDNIGHT = "2026-10-13T03:30:00.000Z";
const YESTERDAY = "2026-10-11T20:00:00.000Z";

test("today's matches lead the strip as HOY and stay there after the final whistle", () => {
  const groups = agendaGroups(
    [row("ayer", YESTERDAY, "post"), row("noche", TONIGHT, "post"), row("manana", AFTER_MIDNIGHT)],
    NOON,
  );
  assert.equal(groups[0]?.label, "HOY");
  assert.equal(groups[0]?.today, true);
  assert.deepEqual(
    groups[0]?.matches.map((match) => match.id),
    ["noche"],
  );
  assert.equal(groups[1]?.label, formatDayHeading(YESTERDAY));
  assert.equal(groups[1]?.today, false);
  assert.equal(groups[2]?.label, formatDayHeading(AFTER_MIDNIGHT));
  assert.notEqual(groups[2]?.label, "HOY");
});

test("a finished HOY match goes back to its weekday once the Argentine day changes", () => {
  const nextMorning = Date.parse("2026-10-13T12:00:00.000Z");
  const groups = agendaGroups([row("noche", TONIGHT, "post")], nextMorning);
  assert.equal(groups[0]?.today, false);
  assert.equal(groups[0]?.label, formatDayHeading(TONIGHT));
});

test("a fecha with nothing on today does not invent a HOY group", () => {
  const groups = agendaGroups([row("manana", AFTER_MIDNIGHT)], NOON);
  assert.equal(groups.some((group) => group.today), false);
  assert.equal(groups[0]?.label, formatDayHeading(AFTER_MIDNIGHT));
});
