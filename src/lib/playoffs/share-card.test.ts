import assert from "node:assert/strict";
import test from "node:test";
import { buildLlaveCardModel } from "./share-card.ts";
import type { BracketSide, KnockoutMatch, StandingRow } from "./types.ts";

function row(partial: Pick<StandingRow, "id" | "short" | "name" | "zone" | "pts">): StandingRow {
  return {
    abbr: partial.short.slice(0, 3).toUpperCase(),
    logo: `https://example.com/${partial.id}.png`,
    stadium: "Mario Kempes",
    color: "#1d4f91",
    played: 10,
    wins: 4,
    draws: 2,
    losses: 4,
    gf: 10,
    ga: 10,
    rank: 1,
    position: 1,
    projected: false,
    ...partial,
  };
}

function side(team: StandingRow, seed: number): BracketSide {
  return { team, seed, zone: team.zone };
}

function match(id: string, home: StandingRow, away: StandingRow): KnockoutMatch {
  return {
    id,
    round: "octavos",
    label: `Partido ${id.slice(1)}`,
    home: side(home, 1),
    away: side(away, 8),
    homeAdvantage: "Local en Mario Kempes",
    note: "",
  };
}

const talleres = row({ id: "19", short: "Talleres", name: "Talleres (Córdoba)", zone: "A", pts: 20 });
const belgrano = row({ id: "4", short: "Belgrano", name: "Belgrano (Córdoba)", zone: "B", pts: 30 });
const instituto = row({ id: "2975", short: "Instituto", name: "Instituto", zone: "A", pts: 40 });
const racing = row({ id: "15", short: "Racing", name: "Racing Club", zone: "B", pts: 18 });

const octavos = [
  match("P1", talleres, belgrano),
  match("P8", instituto, racing),
  match("P4", instituto, belgrano),
  match("P5", racing, talleres),
  match("P2", belgrano, talleres),
  match("P7", racing, instituto),
  match("P3", instituto, racing),
  match("P6", belgrano, talleres),
];

test("the card keeps both llaves and the quarter each pair feeds", () => {
  const model = buildLlaveCardModel(
    {
      tournament: "Torneo Clausura 2026",
      roundLabel: "Fecha 12",
      updatedAt: "2026-10-12T21:40:00Z",
      octavos,
    },
    { predicted: false, live: false, projected: false },
  );
  assert.equal(model.title, "MATA MATA");
  assert.equal(model.badge, "Ahora");
  assert.deepEqual(
    model.columns.map((column) => column.title),
    ["Llave 1", "Llave 2"],
  );
  assert.deepEqual(
    model.columns[0]?.pairs.map((pair) => pair.next),
    ["C1", "C4"],
  );
  assert.deepEqual(model.columns[0]?.pairs[0]?.matches.map((item) => item.id), ["P1", "P8"]);
  assert.equal(model.columns[0]?.pairs[0]?.matches[0]?.stadium, "Mario Kempes");
  assert.equal(model.columns[0]?.pairs[0]?.matches[0]?.teams[0]?.chicken, true);
  assert.equal(model.columns[0]?.pairs[0]?.matches[0]?.teams[1]?.chicken, false);
  assert.match(model.columns[0]?.pairs[0]?.matches[0]?.teams[0]?.detail ?? "", /local · 20 pts/);
  assert.equal(model.stamp, "Actualizado 12 oct 18:40");
});

test("a prediction card says it is not the official bracket", () => {
  const model = buildLlaveCardModel(
    { tournament: "Torneo Clausura 2026", roundLabel: "Fecha 12", updatedAt: "", octavos },
    { predicted: true, live: true, projected: true, changedIds: new Set(["P1"]) },
  );
  assert.equal(model.badge, "Predicción");
  assert.match(model.disclaimer, /No es el cuadro oficial/);
  assert.equal(model.columns[0]?.pairs[0]?.matches[0]?.changed, true);
  assert.equal(model.columns[0]?.pairs[0]?.matches[1]?.changed, false);
});
