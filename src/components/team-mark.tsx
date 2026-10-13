import { GALLINA_SVG, isTalleresCrest } from "@/lib/playoffs/gallina";
import type { StandingRow } from "@/lib/playoffs/types";

export function TeamMark({
  team,
  size = 28,
}: {
  team: Pick<StandingRow, "id" | "short" | "logo" | "name" | "abbr"> | null;
  size?: number;
}) {
  if (!team) {
    return (
      <span className="crest" style={{ width: size, height: size }} aria-hidden>
        <span className="crest-fallback">—</span>
      </span>
    );
  }
  return (
    <span className="crest" style={{ width: size, height: size }}>
      {isTalleresCrest(team) ? (
        <span aria-hidden dangerouslySetInnerHTML={{ __html: GALLINA_SVG }} />
      ) : team.logo ? (
        <img src={team.logo} alt="" width={size} height={size} />
      ) : (
        <span className="crest-fallback" aria-hidden>
          {team.abbr.slice(0, 3)}
        </span>
      )}
    </span>
  );
}
