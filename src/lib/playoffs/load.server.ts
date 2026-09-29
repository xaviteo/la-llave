import { selectFecha } from "./current-fecha";
import { artDayKey } from "./format";
import { FALLBACK_MATCHES, FALLBACK_STANDINGS, FALLBACK_TOURNAMENT } from "./fallback";
import { fixtureRound } from "./fixture";
import { attachRemaining, buildSnapshot, toMatchRow, type RawMatch, type RawStanding } from "./logic";
import type { MatchRow, MatchState, PlayoffSnapshot, ZoneId } from "./types";

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

type ScheduleCache = { at: number; matches: RawMatch[] };
let scheduleCache: ScheduleCache | null = null;
let scheduleInflight: Promise<RawMatch[]> | null = null;
/** Kickoff times barely move, so the full slate is not refetched with the live score. */
const SCHEDULE_TTL_MS = 15 * 60 * 1000;
const SCHEDULE_CONCURRENCY = 4;

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
  const snapshot = buildSnapshot({
    tournament: FALLBACK_TOURNAMENT,
    rawStandings: FALLBACK_STANDINGS,
    rawMatches: FALLBACK_MATCHES,
    source: "fallback",
  });
  return { ...snapshot, agenda: snapshot.matches };
}

function calendarYmds(payload: unknown, today: string): string[] {
  const leagues = (payload as { leagues?: Array<{ calendar?: unknown }> }).leagues;
  const calendar = leagues?.[0]?.calendar;
  if (!Array.isArray(calendar)) return [];
  const dates: string[] = [];
  for (const entry of calendar) {
    if (typeof entry !== "string" || entry.length < 10) continue;
    const ymd = entry.slice(0, 10).replaceAll("-", "");
    if (/^\d{8}$/.test(ymd) && ymd >= shiftYmd(today, -10)) dates.push(ymd);
  }
  return [...new Set(dates)];
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function scoreboardOn(ymd: string): Promise<RawMatch[]> {
  const urls = SCOREBOARD_URLS.map((base) => `${base}?dates=${ymd}`);
  const json = await fetchFirst(urls);
  return parseScoreboard(json).matches;
}

async function refreshSchedule(dates: string[]): Promise<RawMatch[]> {
  if (dates.length === 0) return scheduleCache?.matches ?? [];
  const batches = await mapPool(dates, SCHEDULE_CONCURRENCY, async (ymd) => {
    try {
      return await scoreboardOn(ymd);
    } catch {
      return [] as RawMatch[];
    }
  });
  const matches: RawMatch[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const match of batch) {
      if (!match.id || seen.has(match.id)) continue;
      seen.add(match.id);
      matches.push(match);
    }
  }
  if (matches.length === 0 && scheduleCache) {
    scheduleCache = { at: Date.now(), matches: scheduleCache.matches };
    return scheduleCache.matches;
  }
  scheduleCache = { at: Date.now(), matches };
  return matches;
}

function loadSchedule(dates: string[]): Promise<RawMatch[]> {
  const now = Date.now();
  if (scheduleCache && now - scheduleCache.at < SCHEDULE_TTL_MS) {
    return Promise.resolve(scheduleCache.matches);
  }
  if (scheduleCache) {
    if (!scheduleInflight) {
      scheduleInflight = refreshSchedule(dates).finally(() => {
        scheduleInflight = null;
      });
    }
    return Promise.resolve(scheduleCache.matches);
  }
  if (!scheduleInflight) {
    scheduleInflight = refreshSchedule(dates).finally(() => {
      scheduleInflight = null;
    });
  }
  return scheduleInflight;
}

function overlayFresh(schedule: RawMatch[], fresh: RawMatch[]): RawMatch[] {
  const byId = new Map<string, RawMatch>();
  for (const match of schedule) {
    if (match.id) byId.set(match.id, match);
  }
  for (const match of fresh) {
    if (!match.id) continue;
    const prev = byId.get(match.id);
    byId.set(match.id, prev ? { ...prev, ...match } : match);
  }
  return [...byId.values()];
}

function attachAgenda(
  snapshot: PlayoffSnapshot,
  slate: RawMatch[],
  today: string,
): PlayoffSnapshot {
  const selected = selectFecha(agendaFrom(slate, today));
  return {
    ...attachRemaining(snapshot, slate),
    agenda: selected.matches,
    agendaRound: selected.round,
  };
}

function shiftYmd(ymd: string, days: number): string {
  const date = new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)) + days));
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}${month}${day}`;
}

function agendaFrom(matches: RawMatch[], today: string): MatchRow[] {
  const rows: MatchRow[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    if (!match.id || !match.date || seen.has(match.id)) continue;
    const key = artDayKey(match.date);
    if (!key || key < shiftYmd(today, -10)) continue;
    seen.add(match.id);
    const row = toMatchRow(match);
    const round = fixtureRound(match.homeId, match.awayId);
    if (round != null) row.round = round;
    rows.push(row);
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return rows;
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
    const today = ymdArt(0);
    const scheduled = await loadSchedule(calendarYmds(scoreboardJson, today));
    const slate = overlayFresh(scheduled, scoreboard.matches);
    const snapshot = buildSnapshot({
      tournament: scoreboard.tournament || standings.tournament,
      rawStandings: standings.rows,
      rawMatches: scoreboard.matches,
      source: "espn",
    });
    const withAgenda = attachAgenda(snapshot, slate, today);
    cache = { at: now, data: withAgenda };
    lastGood = withAgenda;
    return withAgenda;
  } catch {
    if (lastGood) return lastGood;
    const snapshot = fallbackSnapshot();
    cache = { at: now, data: snapshot };
    return snapshot;
  }
}
