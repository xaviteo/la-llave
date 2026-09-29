import type { MatchRow, PlayoffSnapshot, StandingRow } from "./types";

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

export function relativeUpdated(iso: string, now = Date.now()): string {
  const delta = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (delta < 20) return "ahora";
  if (delta < 60) return `hace ${delta}s`;
  const minutes = Math.round(delta / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  return hhmm(artDate(iso));
}
