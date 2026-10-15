import type { AperturaTotal, StandingRow } from "./types.ts";

/** Belgrano won the Apertura playoff, so the group-stage place is already his. */
export const APERTURA_CHAMPION_ID = "4";

export type CupMark =
  | "campeon"
  | "libertadores"
  | "libertadores-previa"
  | "sudamericana"
  | "libertadores-apertura";

export type AnnualRow = {
  id: string;
  zone: StandingRow["zone"];
  name: string;
  short: string;
  abbr: string;
  logo: string;
  aperturaPts: number;
  clausuraPts: number;
  pts: number;
  gf: number;
  ga: number;
  played: number;
  position: number;
  marks: CupMark[];
};

const GROUP_SLOTS = 2;
const PREVIA_SLOTS = 1;
const SUDAMERICANA_SLOTS = 6;

export function cupLabel(mark: CupMark): string {
  switch (mark) {
    case "campeon":
      return "Campeón de Liga";
    case "libertadores":
      return "Libertadores";
    case "libertadores-previa":
      return "Libertadores, previa";
    case "sudamericana":
      return "Sudamericana";
    case "libertadores-apertura":
      return "Libertadores, Apertura";
  }
}

function compareAnnual(a: AnnualRow, b: AnnualRow): number {
  return (
    b.pts - a.pts ||
    b.gf - b.ga - (a.gf - a.ga) ||
    b.gf - a.gf ||
    a.name.localeCompare(b.name, "es")
  );
}

/**
 * Annual table = regular-season points of Apertura + Clausura. Playoffs do not count.
 * The leader is Campeón de Liga. Belgrano does not consume a table slot.
 * The next two open places go to the Libertadores group stage, the one after that
 * to the second preliminary round, and the following six to the Sudamericana.
 */
export function buildAnnual(clausura: StandingRow[], apertura: AperturaTotal[]): AnnualRow[] {
  if (apertura.length === 0 || clausura.length === 0) return [];
  const byId = new Map(apertura.map((row) => [row.id, row]));
  const rows: AnnualRow[] = clausura.map((team) => {
    const prior = byId.get(team.id);
    const aperturaPts = prior?.pts ?? 0;
    return {
      id: team.id,
      zone: team.zone,
      name: team.name,
      short: team.short,
      abbr: team.abbr,
      logo: team.logo,
      aperturaPts,
      clausuraPts: team.pts,
      pts: aperturaPts + team.pts,
      gf: (prior?.gf ?? 0) + team.gf,
      ga: (prior?.ga ?? 0) + team.ga,
      played: (prior?.played ?? 0) + team.played,
      position: 0,
      marks: [],
    };
  });
  rows.sort(compareAnnual);
  const queue: CupMark[] = [
    ...Array.from({ length: GROUP_SLOTS }, () => "libertadores" as const),
    ...Array.from({ length: PREVIA_SLOTS }, () => "libertadores-previa" as const),
    ...Array.from({ length: SUDAMERICANA_SLOTS }, () => "sudamericana" as const),
  ];
  let cursor = 0;
  return rows.map((row, index) => {
    const marks: CupMark[] = [];
    if (index === 0) marks.push("campeon");
    if (row.id === APERTURA_CHAMPION_ID) marks.push("libertadores-apertura");
    else if (cursor < queue.length) {
      const mark = queue[cursor];
      if (mark) marks.push(mark);
      cursor += 1;
    }
    return { ...row, position: index + 1, marks };
  });
}
