export type TeamMeta = {
  short: string;
  stadium: string;
  color: string;
};

/** Display names, stadiums and stripe colors for the 2026 Primera clubs. */
export const TEAM_META: Record<string, TeamMeta> = {
  "5": { short: "Boca", stadium: "La Bombonera", color: "#0a3d91" },
  "8": { short: "Estudiantes", stadium: "U.N.O. Hirschi", color: "#c4a35a" },
  "11": { short: "Independiente", stadium: "Libertadores de América", color: "#c81e1e" },
  "12": { short: "Lanús", stadium: "Ciudad de Lanús", color: "#6b1d2a" },
  "14": { short: "Newell's", stadium: "Marcelo Bielsa", color: "#c81e1e" },
  "18": { short: "San Lorenzo", stadium: "Nuevo Gasómetro", color: "#c81e1e" },
  "19": { short: "Talleres", stadium: "Mario Kempes", color: "#1d4f91" },
  "20": { short: "Unión", stadium: "15 de Abril", color: "#c81e1e" },
  "21": { short: "Vélez", stadium: "José Amalfitani", color: "#1f4e8c" },
  "2975": { short: "Instituto", stadium: "Presidente Perón", color: "#c81e1e" },
  "7764": { short: "Platense", stadium: "Ciudad de Vicente López", color: "#6b7344" },
  "8950": { short: "Defensa", stadium: "Norberto Tomaghello", color: "#c4a35a" },
  "11972": { short: "Gimnasia (M)", stadium: "Víctor Legrotaglie", color: "#1f4e8c" },
  "11989": { short: "C. Córdoba", stadium: "Único Madre de Ciudades", color: "#1d4f91" },
  "17702": { short: "Riestra", stadium: "Guillermo Laza", color: "#1a1a1a" },
  "3": { short: "Argentinos", stadium: "Diego Armando Maradona", color: "#c81e1e" },
  "4": { short: "Belgrano", stadium: "Gigante de Alberdi", color: "#3d6ea8" },
  "9": { short: "Gimnasia", stadium: "Juan Carmelo Zerillo", color: "#1f4e8c" },
  "10": { short: "Huracán", stadium: "Tomás Adolfo Ducó", color: "#c81e1e" },
  "15": { short: "Racing", stadium: "El Cilindro", color: "#3d7eab" },
  "16": { short: "River", stadium: "Mâs Monumental", color: "#c81e1e" },
  "17": { short: "Central", stadium: "Gigante de Arroyito", color: "#1f4e8c" },
  "235": { short: "Banfield", stadium: "Florencio Sola", color: "#2f6b3a" },
  "7767": { short: "Tigre", stadium: "José Dellagiovanna", color: "#1f4e8c" },
  "9739": { short: "Aldosivi", stadium: "José María Minella", color: "#6b7344" },
  "9744": { short: "Ind. Rivadavia", stadium: "Bautista Gargantini", color: "#1f4e8c" },
  "9785": { short: "Atl. Tucumán", stadium: "José Fierro", color: "#3d7eab" },
  "10060": { short: "Barracas", stadium: "Claudio Chiqui Tapia", color: "#c81e1e" },
  "10158": { short: "Sarmiento", stadium: "Eva Perón", color: "#2f6b3a" },
  "19685": { short: "Est. (RC)", stadium: "Ciudad de Río Cuarto", color: "#1f4e8c" },
};

export function teamMeta(id: string, fallbackShort: string): TeamMeta {
  return (
    TEAM_META[id] ?? {
      short: fallbackShort,
      stadium: "Estadio local",
      color: "#4b5563",
    }
  );
}
