export type ZoneId = "A" | "B";
export type MatchState = "pre" | "in" | "post";

export type StandingRow = {
  id: string;
  zone: ZoneId;
  name: string;
  short: string;
  abbr: string;
  logo: string;
  stadium: string;
  color: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  pts: number;
  /** ESPN official rank before live overlay. */
  rank: number;
  position: number;
  /** True when a live (or lagging) match was applied on top of the table. */
  projected: boolean;
};

export type MatchRow = {
  id: string;
  date: string;
  venue: string;
  state: MatchState;
  clock: string;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  /** Result already counted in the official table. */
  counted: boolean;
  projected: boolean;
  homeRecord?: string;
  awayRecord?: string;
  round?: number;
};

export type RemainingMatch = MatchRow & { round: number; label: string };

export type ScorePrediction = { home: number; away: number };
export type PredictionMap = Record<string, ScorePrediction>;

export type BracketSide = {
  team: StandingRow | null;
  seed: number;
  zone: ZoneId;
};

export type KnockoutMatch = {
  id: string;
  round: "octavos" | "cuartos" | "semis" | "final";
  label: string;
  home: BracketSide;
  away: BracketSide;
  homeAdvantage: string;
  note: string;
};

export type PlayoffSnapshot = {
  tournament: string;
  roundLabel: string;
  updatedAt: string;
  source: "espn" | "fallback";
  live: boolean;
  projected: boolean;
  zones: { A: StandingRow[]; B: StandingRow[] };
  matches: MatchRow[];
  octavos: KnockoutMatch[];
  remaining: RemainingMatch[];
  cuartos: { id: string; label: string; a: string; b: string }[];
  semis: { id: string; label: string; a: string; b: string }[];
  finalNote: string;
};
