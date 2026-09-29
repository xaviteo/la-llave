import type { MatchRow } from "./types";

const ART_OFFSET_MS = 3 * 60 * 60 * 1000;
/** A match this far after the previous one was postponed out of the weekend. */
const POSTPONED_GAP_MS = 3 * 24 * 60 * 60 * 1000;
/** Keep a finished fecha up through the night, then hand the board over. */
const HANDOFF_HOUR_ART = 8;

export function nextMorningArt(iso: string, hour = HANDOFF_HOUR_ART): number {
  const art = new Date(new Date(iso).getTime() - ART_OFFSET_MS);
  return Date.UTC(art.getUTCFullYear(), art.getUTCMonth(), art.getUTCDate() + 1, hour + 3, 0, 0);
}

function splitRound(matches: MatchRow[]): { body: MatchRow[]; postponed: MatchRow[] } {
  const dated = matches
    .filter((match) => match.date && !Number.isNaN(new Date(match.date).getTime()))
    .sort((a, b) => a.date.localeCompare(b.date));
  const body: MatchRow[] = [];
  const postponed: MatchRow[] = [];
  for (const match of dated) {
    const prev = body[body.length - 1];
    const gap = prev ? new Date(match.date).getTime() - new Date(prev.date).getTime() : 0;
    if (postponed.length > 0 || (prev && gap > POSTPONED_GAP_MS)) postponed.push(match);
    else body.push(match);
  }
  for (const match of matches) {
    if (match.date && !Number.isNaN(new Date(match.date).getTime())) continue;
    if (match.state !== "post") body.push(match);
  }
  return { body, postponed };
}

function isClosed(body: MatchRow[], now: number): boolean {
  if (body.length === 0) return true;
  if (body.some((match) => match.state !== "post")) return false;
  const last = [...body].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (!last?.date) return true;
  return now >= nextMorningArt(last.date);
}

/** The fecha on the board: the first one still open, with every match of that fecha. */
export function selectFecha(
  matches: MatchRow[],
  now = Date.now(),
): { round: number | null; matches: MatchRow[] } {
  const byRound = new Map<number, MatchRow[]>();
  for (const match of matches) {
    if (match.round == null) continue;
    const list = byRound.get(match.round) ?? [];
    list.push(match);
    byRound.set(match.round, list);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  if (rounds.length === 0) return { round: null, matches: [] };

  let chosen: number | null = null;
  for (const round of rounds) {
    const { body } = splitRound(byRound.get(round) ?? []);
    if (!isClosed(body, now)) {
      chosen = round;
      break;
    }
  }
  if (chosen == null) chosen = rounds[rounds.length - 1] ?? null;
  const selected = chosen == null ? [] : (byRound.get(chosen) ?? []);
  return {
    round: chosen,
    matches: [...selected].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
  };
}
