import type { MatchRow, PlayoffSnapshot, StandingRow } from "./types";

const ART_OFFSET_MS = 3 * 60 * 60 * 1000;

function artDate(iso: string): Date {
  return new Date(new Date(iso).getTime() - ART_OFFSET_MS);
}

function hhmm(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
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
