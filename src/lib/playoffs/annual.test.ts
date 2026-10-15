import assert from "node:assert/strict";
import test from "node:test";
import { buildAnnual } from "./annual.ts";
import type { AperturaTotal, StandingRow, ZoneId } from "./types.ts";

function team(id: string, pts: number, gf = 10, ga = 8): StandingRow {
  return {
    id,
    zone: (Number(id) % 2 === 0 ? "A" : "B") as ZoneId,
    name: `Club ${id}`,
    short: `Club ${id}`,
    abbr: id,
    logo: "",
    stadium: "",
    color: "",
    played: 12,
    wins: 4,
    draws: 2,
    losses: 6,
    gf,
    ga,
    pts,
    rank: 1,
    position: 1,
    projected: false,
  };
}

test("Belgrano keeps the Apertura place and the annual slots move down", () => {
  const clausura = ["4", "1", "2", "3", "5", "6", "7", "8", "9", "10", "11", "12"].map((id, index) =>
    team(id, 40 - index, 20 - index, 8),
  );
  const apertura: AperturaTotal[] = clausura.map((row) => ({
    id: row.id,
    pts: row.id === "4" ? 26 : 20,
    gf: 17,
    ga: 13,
    played: 16,
  }));
  const table = buildAnnual(clausura, apertura);
  const belgrano = table[0];
  assert.equal(belgrano?.id, "4");
  assert.deepEqual(belgrano?.marks, ["campeon", "libertadores-apertura"]);
  assert.equal(belgrano?.pts, 66);

  const groups = table.filter((row) => row.marks.includes("libertadores")).map((row) => row.id);
  assert.deepEqual(groups, ["1", "2"]);
  assert.deepEqual(
    table.filter((row) => row.marks.includes("libertadores-previa")).map((row) => row.id),
    ["3"],
  );
  assert.deepEqual(
    table.filter((row) => row.marks.includes("sudamericana")).map((row) => row.id),
    ["5", "6", "7", "8", "9", "10"],
  );
});

test("a Belgrano mid-table still frees his slot for the next club", () => {
  const ids = ["1", "2", "3", "5", "4", "6", "7", "8", "9", "10", "11"];
  const clausura = ids.map((id, index) => team(id, 30 - index));
  const apertura: AperturaTotal[] = clausura.map((row) => ({
    id: row.id,
    pts: 10,
    gf: 10,
    ga: 10,
    played: 16,
  }));
  const table = buildAnnual(clausura, apertura);
  assert.equal(table[0]?.marks.includes("campeon"), true);
  assert.equal(table[0]?.marks.includes("libertadores"), true);
  assert.equal(table.find((row) => row.id === "4")?.marks.includes("libertadores-apertura"), true);
  assert.equal(table.find((row) => row.id === "4")?.marks.includes("sudamericana"), false);
  assert.deepEqual(
    table.filter((row) => row.marks.includes("sudamericana")).map((row) => row.id),
    ["5", "6", "7", "8", "9", "10"],
  );
  assert.deepEqual(table.at(-1)?.marks, []);
});

test("without the Apertura there is no annual table", () => {
  assert.deepEqual(buildAnnual([team("4", 10)], []), []);
});
