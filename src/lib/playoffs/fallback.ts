import type { RawMatch, RawStanding } from "./logic";

export const FALLBACK_TOURNAMENT = "Torneo Clausura 2026";

export const FALLBACK_STANDINGS: RawStanding[] = [
  { id: "5", zone: "A", name: "Boca Juniors", short: "Boca", abbr: "CABJ", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/5.png", played: 9, wins: 3, draws: 5, losses: 1, gf: 12, ga: 11, pts: 14, rank: 6 },
  { id: "8", zone: "A", name: "Estudiantes de La Plata", short: "Estudiantes", abbr: "EST", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/8.png", played: 9, wins: 3, draws: 1, losses: 5, gf: 9, ga: 9, pts: 10, rank: 11 },
  { id: "11", zone: "A", name: "Independiente", short: "Independiente", abbr: "IND", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/11.png", played: 10, wins: 5, draws: 2, losses: 3, gf: 10, ga: 8, pts: 17, rank: 5 },
  { id: "12", zone: "A", name: "Lanús", short: "Lanús", abbr: "LAN", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/12.png", played: 9, wins: 4, draws: 1, losses: 4, gf: 11, ga: 8, pts: 13, rank: 7 },
  { id: "14", zone: "A", name: "Newell's Old Boys", short: "Newell's", abbr: "NOB", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/14.png", played: 9, wins: 3, draws: 4, losses: 2, gf: 10, ga: 8, pts: 13, rank: 8 },
  { id: "18", zone: "A", name: "San Lorenzo", short: "San Lorenzo", abbr: "SLO", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/18.png", played: 9, wins: 3, draws: 2, losses: 4, gf: 4, ga: 6, pts: 11, rank: 10 },
  { id: "19", zone: "A", name: "Talleres (Córdoba)", short: "Talleres", abbr: "TALL", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/19.png", played: 10, wins: 2, draws: 2, losses: 6, gf: 11, ga: 17, pts: 8, rank: 14 },
  { id: "20", zone: "A", name: "Unión (Santa Fe)", short: "Unión (SF)", abbr: "USF", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/20.png", played: 10, wins: 4, draws: 1, losses: 5, gf: 17, ga: 16, pts: 13, rank: 9 },
  { id: "21", zone: "A", name: "Vélez Sarsfield", short: "Vélez", abbr: "VEL", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/21.png", played: 9, wins: 4, draws: 5, losses: 0, gf: 12, ga: 7, pts: 17, rank: 4 },
  { id: "2975", zone: "A", name: "Instituto (Córdoba)", short: "Instituto", abbr: "IACC", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2975.png", played: 10, wins: 7, draws: 1, losses: 2, gf: 13, ga: 7, pts: 22, rank: 1 },
  { id: "7764", zone: "A", name: "Platense", short: "Platense", abbr: "PLA", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/7764.png", played: 9, wins: 2, draws: 3, losses: 4, gf: 9, ga: 14, pts: 9, rank: 13 },
  { id: "8950", zone: "A", name: "Defensa y Justicia", short: "Def. y Jus.", abbr: "DYJ", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/8950.png", played: 10, wins: 5, draws: 3, losses: 2, gf: 13, ga: 11, pts: 18, rank: 2 },
  { id: "11972", zone: "A", name: "Gimnasia (Mendoza)", short: "Gimnasia (M)", abbr: "GMZ", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/11972.png", played: 10, wins: 5, draws: 2, losses: 3, gf: 14, ga: 9, pts: 17, rank: 3 },
  { id: "11989", zone: "A", name: "Central Córdoba (Santiago del Estero)", short: "C. Córdoba (SE)", abbr: "CTR", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/11989.png", played: 10, wins: 2, draws: 2, losses: 6, gf: 7, ga: 13, pts: 8, rank: 15 },
  { id: "17702", zone: "A", name: "Deportivo Riestra", short: "Riestra", abbr: "RIE", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/17702.png", played: 10, wins: 2, draws: 4, losses: 4, gf: 8, ga: 10, pts: 10, rank: 12 },
  { id: "3", zone: "B", name: "Argentinos Juniors", short: "Argentinos", abbr: "ARGJ", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3.png", played: 9, wins: 5, draws: 3, losses: 1, gf: 13, ga: 8, pts: 18, rank: 1 },
  { id: "4", zone: "B", name: "Belgrano (Córdoba)", short: "Belgrano", abbr: "BEL", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/4.png", played: 9, wins: 3, draws: 4, losses: 2, gf: 9, ga: 6, pts: 13, rank: 7 },
  { id: "9", zone: "B", name: "Gimnasia La Plata", short: "Gimnasia LP", abbr: "GLP", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9.png", played: 10, wins: 5, draws: 2, losses: 3, gf: 15, ga: 15, pts: 17, rank: 2 },
  { id: "10", zone: "B", name: "Huracán", short: "Huracán", abbr: "HUR", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/10.png", played: 10, wins: 4, draws: 4, losses: 2, gf: 10, ga: 8, pts: 16, rank: 3 },
  { id: "15", zone: "B", name: "Racing Club", short: "Racing", abbr: "RAC", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/15.png", played: 10, wins: 2, draws: 2, losses: 6, gf: 11, ga: 16, pts: 8, rank: 13 },
  { id: "16", zone: "B", name: "River Plate", short: "River Plate", abbr: "RIV", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/16.png", played: 10, wins: 4, draws: 1, losses: 5, gf: 13, ga: 12, pts: 13, rank: 9 },
  { id: "17", zone: "B", name: "Rosario Central", short: "Rosario Central", abbr: "ROS", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/17.png", played: 9, wins: 4, draws: 3, losses: 2, gf: 10, ga: 8, pts: 15, rank: 5 },
  { id: "235", zone: "B", name: "Banfield", short: "Banfield", abbr: "BAN", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/235.png", played: 10, wins: 2, draws: 3, losses: 5, gf: 11, ga: 16, pts: 9, rank: 12 },
  { id: "7767", zone: "B", name: "Tigre", short: "Tigre", abbr: "TIG", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/7767.png", played: 9, wins: 3, draws: 3, losses: 3, gf: 7, ga: 6, pts: 12, rank: 10 },
  { id: "9739", zone: "B", name: "Aldosivi", short: "Aldosivi", abbr: "ALDO", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9739.png", played: 9, wins: 1, draws: 2, losses: 6, gf: 11, ga: 16, pts: 5, rank: 15 },
  { id: "9744", zone: "B", name: "Independiente Rivadavia", short: "Ind. Rivadavia", abbr: "RIV", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9744.png", played: 9, wins: 4, draws: 2, losses: 3, gf: 13, ga: 13, pts: 14, rank: 6 },
  { id: "9785", zone: "B", name: "Atlético Tucumán", short: "Atl Tucumán", abbr: "CAT", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9785.png", played: 9, wins: 3, draws: 4, losses: 2, gf: 7, ga: 5, pts: 13, rank: 8 },
  { id: "10060", zone: "B", name: "Barracas Central", short: "Barracas", abbr: "BAR", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/10060.png", played: 9, wins: 3, draws: 3, losses: 3, gf: 5, ga: 6, pts: 12, rank: 11 },
  { id: "10158", zone: "B", name: "Sarmiento (Junín)", short: "Sarmiento (J)", abbr: "SARM", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/10158.png", played: 10, wins: 5, draws: 1, losses: 4, gf: 17, ga: 16, pts: 16, rank: 4 },
  { id: "19685", zone: "B", name: "Estudiantes de Río Cuarto", short: "Estudiantes RC", abbr: "AAE", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/19685.png", played: 9, wins: 1, draws: 3, losses: 5, gf: 4, ga: 11, pts: 6, rank: 14 },
];

export const FALLBACK_MATCHES: RawMatch[] = [
  { id: "401841577", date: "2026-09-20T17:45Z", venue: "Estadio Pedro Bidegain", state: "in", clock: "47'", homeId: "18", awayId: "5", homeScore: 0, awayScore: 0 },
  { id: "401841581", date: "2026-09-20T20:00Z", venue: "Ciudad de Vicente López", state: "pre", clock: "17:00", homeId: "7764", awayId: "14", homeScore: 0, awayScore: 0 },
  { id: "401841578", date: "2026-09-20T20:00Z", venue: "Gigante de Arroyito", state: "pre", clock: "17:00", homeId: "17", awayId: "3", homeScore: 0, awayScore: 0 },
  { id: "401841571", date: "2026-09-20T22:15Z", venue: "El Gigante de Alberdi", state: "pre", clock: "19:15", homeId: "4", awayId: "19685", homeScore: 0, awayScore: 0 },
  { id: "401841570", date: "2026-09-21T00:30Z", venue: "José Amalfitani", state: "pre", clock: "21:30", homeId: "21", awayId: "7767", homeScore: 0, awayScore: 0 },
];
