import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/playoffs/types";

const TALLERES_ID = "19";

function isTalleres(team: Pick<StandingRow, "id" | "short" | "name">): boolean {
  return team.id === TALLERES_ID || team.short === "Talleres" || team.name.startsWith("Talleres");
}

function Gallina() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
      <ellipse cx="14.5" cy="20.5" rx="11" ry="8.2" fill="#14202b" />
      <ellipse cx="14.5" cy="19.8" rx="9.5" ry="6.7" fill="#fffaf2" />
      <circle cx="21" cy="13.2" r="6.5" fill="#14202b" />
      <circle cx="21" cy="12.6" r="5.3" fill="#fffaf2" />
      <path
        d="M16.4 8.4c.3-2.6 1.8-4 2.7-4 .8 0 1.4 1 1.5 2.5.6-1.8 1.8-2.9 2.7-2.6.8.2.9 1.6.5 3.1.5-1.4 1.6-2.2 2.4-1.8.7.4.4 1.8 0 2.9-1.6.2-4 .9-7 1.1-.9-.4-2-.9-2.8-1.2z"
        fill="#e10600"
      />
      <path d="M25.4 13.2 30.2 14.8 25.4 16.8z" fill="#f5b301" />
      <ellipse cx="24.6" cy="16.6" rx="1.15" ry="1.7" fill="#e10600" />
      <circle cx="22.3" cy="12" r="1.35" fill="#14202b" />
      <circle cx="22.7" cy="11.55" r="0.42" fill="#fff" />
      <ellipse cx="12.4" cy="19.8" rx="3.5" ry="2.5" fill="#f0e4d0" />
    </svg>
  );
}

export function TeamMark({
  team,
  size = "md",
}: {
  team: Pick<StandingRow, "id" | "short" | "logo" | "name" | "abbr"> | null;
  size?: "xs" | "sm" | "md";
}) {
  const dim = size === "xs" ? "size-4" : size === "sm" ? "size-6" : "size-8";
  if (!team) {
    return (
      <span
        className={cn(
          dim,
          "grid shrink-0 place-items-center rounded-md bg-surface-2 text-[10px] text-faint",
        )}
      >
        —
      </span>
    );
  }
  return (
    <span className={cn(dim, "relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-surface-2")}>
      {isTalleres(team) ? (
        <Gallina />
      ) : team.logo ? (
        <img
          src={team.logo}
          alt=""
          className="size-full object-contain p-0.5 outline outline-1 -outline-offset-1 outline-fg/10"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling;
            if (fallback instanceof HTMLElement) fallback.style.display = "grid";
          }}
        />
      ) : null}
      <span
        className="absolute inset-0 hidden place-items-center text-[9px] font-semibold uppercase tracking-wide text-muted"
        aria-hidden
      >
        {team.abbr.slice(0, 3)}
      </span>
    </span>
  );
}
