import { FALLBACK_MATCHES, FALLBACK_STANDINGS, FALLBACK_TOURNAMENT } from "./fallback";
import { buildSnapshot, type RawMatch, type RawStanding } from "./logic";
import type { MatchState, PlayoffSnapshot, ZoneId } from "./types";

const STANDINGS_URLS = [
  "https://site.web.api.espn.com/apis/v2/sports/soccer/arg.1/standings",
  "https://site.api.espn.com/apis/v2/sports/soccer/arg.1/standings",
];
const SCOREBOARD_URLS = [
  "https://site.web.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard",
];

const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

type CacheEntry = { at: number; data: PlayoffSnapshot };
let cache: CacheEntry | null = null;
let lastGood: PlayoffSnapshot | null = null;
const TTL_MS = 15_000;

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function stat(entry: { stats?: Array<{ name?: string; value?: unknown; displayValue?: unknown }> }, name: string): number {
  const found = entry.stats?.find((item) => item.name === name);
  return num(found?.value ?? found?.displayValue);
}

function parseStandings(payload: unknown): { tournament: string; rows: RawStanding[] } {
  const root = payload as {
    name?: string;
    children?: Array<{
      name?: string;
      abbreviation?: string;
      standings?: { entries?: Array<{ team?: Record<string, unknown>; stats?: Array<{ name?: string; value?: unknown; displayValue?: unknown }> }> };
    }>;
  };
  const rows: RawStanding[] = [];
  for (const child of root.children ?? []) {
    const name = `${child.name ?? ""} ${child.abbreviation ?? ""}`;
    const zoneId: ZoneId = /\bB\b|Group B|Zona B/i.test(name) ? "B" : "A";
    for (const entry of child.standings?.entries ?? []) {
      const team = entry.team ?? {};
      const logos = (team.logos as Array<{ href?: string }> | undefined) ?? [];
      rows.push({
        id: String(team.id ?? ""),
        zone: zoneId,
        name: String(team.displayName ?? team.name ?? ""),
        short: String(team.shortDisplayName ?? team.abbreviation ?? "").trim(),
        abbr: String(team.abbreviation ?? ""),
        logo: logos[0]?.href ?? "",
        played: stat(entry, "gamesPlayed"),
        wins: stat(entry, "wins"),
        draws: stat(entry, "ties"),
        losses: stat(entry, "losses"),
        gf: stat(entry, "pointsFor"),
        ga: stat(entry, "pointsAgainst"),
        pts: stat(entry, "points"),
        rank: stat(entry, "rank"),
      });
    }
  }
  if (rows.filter((row) => row.zone === "A").length !== 15 || rows.filter((row) => row.zone === "B").length !== 15) {
    throw new Error("Standings incompletas");
  }
  return { tournament: root.name?.includes("Liga") ? "Torneo Clausura 2026" : FALLBACK_TOURNAMENT, rows };
}

function parseState(raw: string | undefined): MatchState {
  if (raw === "in") return "in";
  if (raw === "post") return "post";
  return "pre";
}

function parseScoreboard(payload: unknown): { tournament: string; matches: RawMatch[] } {
  const root = payload as {
    leagues?: Array<{ season?: { type?: { name?: string } } }>;
    events?: Array<{
      id?: string;
      date?: string;
      name?: string;
      competitions?: Array<{
        venue?: { fullName?: string };
        status?: { displayClock?: string; type?: { state?: string; shortDetail?: string; detail?: string } };
        competitors?: Array<{
          homeAway?: string;
          score?: unknown;
          records?: Array<{ summary?: string }>;
          team?: { id?: string };
        }>;
      }>;
    }>;
  };
  const matches: RawMatch[] = [];
  for (const event of root.events ?? []) {
    const competition = event.competitions?.[0];
    if (!competition) continue;
    const home = competition.competitors?.find((item) => item.homeAway === "home");
    const away = competition.competitors?.find((item) => item.homeAway === "away");
    const type = competition.status?.type;
    const state = parseState(type?.state);
    const liveClock = competition.status?.displayClock;
    const clock =
      state === "in" && liveClock && liveClock !== "0'"
        ? liveClock
        : String(type?.shortDetail || type?.detail || "");
    matches.push({
      id: String(event.id ?? ""),
      date: String(event.date ?? ""),
      venue: competition.venue?.fullName ?? "",
      state,
      clock,
      homeId: String(home?.team?.id ?? ""),
      awayId: String(away?.team?.id ?? ""),
      homeScore: num(home?.score),
      awayScore: num(away?.score),
      homeRecord: home?.records?.[0]?.summary,
      awayRecord: away?.records?.[0]?.summary,
    });
  }
  const seasonName = root.leagues?.[0]?.season?.type?.name;
  return {
    tournament: seasonName?.includes("Clausura")
      ? "Torneo Clausura 2026"
      : seasonName?.includes("Apertura")
        ? "Torneo Apertura 2026"
        : FALLBACK_TOURNAMENT,
    matches,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!response.ok) throw new Error(`${url} → ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFirst(urls: string[]): Promise<unknown> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}

function ymdArt(offsetDays = 0): string {
  const shifted = new Date(Date.now() - 3 * 60 * 60 * 1000 + offsetDays * 86_400_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function fallbackSnapshot(): PlayoffSnapshot {
  return buildSnapshot({
    tournament: FALLBACK_TOURNAMENT,
    rawStandings: FALLBACK_STANDINGS,
    rawMatches: FALLBACK_MATCHES,
    source: "fallback",
  });
}

export async function loadSnapshot(): Promise<PlayoffSnapshot> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.data;

  try {
    const tomorrow = `${SCOREBOARD_URLS[0]}?dates=${ymdArt(1)}`;
    const [standingsJson, scoreboardJson, extraJson] = await Promise.all([
      fetchFirst(STANDINGS_URLS),
      fetchFirst(SCOREBOARD_URLS),
      fetchJson(tomorrow).catch(() => null),
    ]);
    const standings = parseStandings(standingsJson);
    const scoreboard = parseScoreboard(scoreboardJson);
    const extra = extraJson ? parseScoreboard(extraJson).matches : [];
    const byId = new Map(scoreboard.matches.map((match) => [match.id, match]));
    for (const match of extra) {
      if (!byId.has(match.id)) scoreboard.matches.push(match);
    }
    const snapshot = buildSnapshot({
      tournament: scoreboard.tournament || standings.tournament,
      rawStandings: standings.rows,
      rawMatches: scoreboard.matches,
      source: "espn",
    });
    cache = { at: now, data: snapshot };
    lastGood = snapshot;
    return snapshot;
  } catch {
    if (lastGood) return lastGood;
    const snapshot = fallbackSnapshot();
    cache = { at: now, data: snapshot };
    return snapshot;
  }
}
