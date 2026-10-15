import { fixtureRound } from "./fixture.ts";

const FECHAS = 16;

type Roundable = {
  id: string;
  date: string;
  homeId: string;
  awayId: string;
  round?: number;
};

/**
 * ESPN does not send a fecha number. Known pairs keep the official round.
 * Everything else takes the earliest fecha in which both clubs are still free,
 * so a match postponed past the next weekend falls back into the gap.
 */
export function assignRounds<T extends Roundable>(matches: T[]): T[] {
  const ordered = [...matches].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const taken = new Map<string, Set<number>>();
  const claim = (id: string, round: number) => {
    if (!id) return;
    const set = taken.get(id) ?? new Set<number>();
    set.add(round);
    taken.set(id, set);
  };
  const free = (id: string, round: number) => !taken.get(id)?.has(round);
  const knownRound = (match: Roundable): number | null =>
    fixtureRound(match.homeId, match.awayId) ?? match.round ?? null;

  for (const match of ordered) {
    const known = knownRound(match);
    if (known == null) continue;
    claim(match.homeId, known);
    claim(match.awayId, known);
  }

  return ordered.map((match) => {
    const known = knownRound(match);
    if (known != null) return { ...match, round: known };
    let round = 1;
    while (round <= FECHAS && !(free(match.homeId, round) && free(match.awayId, round))) {
      round += 1;
    }
    if (round > FECHAS) return match;
    claim(match.homeId, round);
    claim(match.awayId, round);
    return { ...match, round };
  });
}
