import { ROUND_LABELS } from "./fixture.ts";
import type { MatchRow, PlayoffSnapshot, RemainingMatch, StandingRow } from "./types";

const ART_OFFSET_MS = 3 * 60 * 60 * 1000;

function artDate(iso: string): Date {
  return new Date(new Date(iso).getTime() - ART_OFFSET_MS);
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

function hhmm(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function artDayKey(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const date = artDate(iso);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}${month}${day}`;
}

export type AgendaGroup = {
  key: string;
  label: string;
  today: boolean;
  matches: MatchRow[];
};

/** Today's matches stay under HOY until the next Argentine day, finished or not. */
export function agendaGroups(matches: MatchRow[], now = Date.now()): AgendaGroup[] {
  const today = artDayKey(new Date(now).toISOString());
  const map = new Map<string, AgendaGroup>();
  for (const match of matches) {
    const key = artDayKey(match.date) || match.id;
    const group = map.get(key) ?? {
      key,
      label: key === today ? "HOY" : formatDayHeading(match.date),
      today: key === today,
      matches: [],
    };
    group.matches.push(match);
    map.set(key, group);
  }
  const groups = [...map.values()];
  return [...groups.filter((group) => group.today), ...groups.filter((group) => !group.today)];
}

export function formatDayHeading(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const date = artDate(iso);
  const weekday = WEEKDAYS[date.getUTCDay()] ?? "";
  const label = `${weekday} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()] ?? ""}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatClock(match: MatchRow): string {
  if (match.state === "in") {
    const clock = match.clock
      .replace("STATUS_SECOND_HALF", "2T")
      .replace("STATUS_FIRST_HALF", "1T")
      .replace("STATUS_HALFTIME", "ET")
      .replace("Scheduled", "");
    return clock || "VIVO";
  }
  if (match.state === "post") return "Final";
  try {
    return hhmm(artDate(match.date));
  } catch {
    return match.clock;
  }
}

export function teamById(data: PlayoffSnapshot, id: string): StandingRow | undefined {
  return data.zones.A.concat(data.zones.B).find((row) => row.id === id);
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function seasonParts(tournament: string): { competition: string; year: string } {
  const year = tournament.match(/\b(20\d{2})\b/)?.[1] ?? "";
  if (/clausura/i.test(tournament)) return { competition: "Clausura", year };
  if (/apertura/i.test(tournament)) return { competition: "Apertura", year };
  const competition = tournament.replace(/\b20\d{2}\b/, "").replace(/^torneo\s+/i, "").trim();
  return { competition: competition || tournament, year };
}

export function seasonLine(tournament: string, rest: string): string {
  const { competition, year } = seasonParts(tournament);
  const head = [competition, year].filter(Boolean).join(" ");
  return rest ? `${head} — ${rest}` : head;
}

const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function formatUpdatedStamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const date = artDate(iso);
  const month = MONTHS_LONG[date.getUTCMonth()] ?? "";
  return `${date.getUTCDate()} de ${month} de ${date.getUTCFullYear()}, ${hhmm(date)}`;
}

export type MatchStatus = { score: string | null; label: string; live: boolean };

export function matchStatus(match: MatchRow): MatchStatus {
  const clock = match.clock.toLowerCase();
  if (match.state !== "post" && /postpon|posterg|suspend|cancel|ppd|delay/.test(clock)) {
    return {
      score: null,
      label: /suspend/.test(clock) ? "Suspendido" : "Postergado",
      live: false,
    };
  }
  if (match.state === "in") {
    return { score: `${match.homeScore}–${match.awayScore}`, label: formatClock(match), live: true };
  }
  if (match.state === "post") {
    return { score: `${match.homeScore}–${match.awayScore}`, label: "Final", live: false };
  }
  if (!match.date) return { score: null, label: "Sin horario", live: false };
  return { score: null, label: formatClock(match), live: false };
}

export type FechaBoard = {
  round: number;
  label: string;
  matches: MatchRow[];
};

function richness(match: MatchRow): number {
  let score = 0;
  if (match.date) score += 2;
  if (match.venue) score += 1;
  if (match.state !== "pre") score += 4;
  if (!match.id.startsWith("r")) score += 1;
  return score;
}

/** One row per pairing. A played match wins over a fixture stub with another id. */
export function fechaBoards(calendar: MatchRow[], remaining: RemainingMatch[]): FechaBoard[] {
  const byRound = new Map<number, Map<string, MatchRow>>();
  const place = (match: MatchRow) => {
    if (match.round == null) return;
    const pair = `${match.homeId}-${match.awayId}`;
    const bucket = byRound.get(match.round) ?? new Map<string, MatchRow>();
    const prev = bucket.get(pair);
    if (!prev || richness(match) >= richness(prev)) bucket.set(pair, match);
    byRound.set(match.round, bucket);
  };
  for (const match of calendar) place(match);
  for (const match of remaining) place(match);
  return [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, bucket]) => ({
      round,
      label: ROUND_LABELS[round] ?? `Fecha ${round}`,
      matches: [...bucket.values()].sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      ),
    }));
}

export function relativeUpdated(iso: string, now = Date.now()): string {
  const delta = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (delta < 20) return "ahora";
  if (delta < 60) return `hace ${delta}s`;
  const minutes = Math.round(delta / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  return hhmm(artDate(iso));
}
