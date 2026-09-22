import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/playoffs/types";

export function TeamMark({
  team,
  size = "md",
}: {
  team: Pick<StandingRow, "short" | "logo" | "name" | "abbr"> | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "size-6" : "size-8";
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
      {team.logo ? (
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
