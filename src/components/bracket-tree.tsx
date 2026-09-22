import type { ReactNode } from "react";
import type { KnockoutMatch, PlayoffSnapshot } from "@/lib/playoffs/types";
import { TeamMark } from "@/components/team-mark";
import { cn } from "@/lib/utils";

export function BracketTree({
  data,
  focusId,
  onFocus,
  changedIds,
}: {
  data: PlayoffSnapshot;
  focusId: string | null;
  onFocus: (id: string) => void;
  changedIds?: Set<string>;
}) {
  const byId = new Map(data.octavos.map((match) => [match.id, match]));
  const pick = (id: string) => byId.get(id);

  const node = (id: string) => {
    const match = pick(id);
    if (!match) return null;
    return (
      <OctavosNode
        match={match}
        focusId={focusId}
        onFocus={onFocus}
        changed={changedIds?.has(id) ?? false}
      />
    );
  };

  return (
    <div className="no-scrollbar overflow-x-auto">
      <p className="mb-2 text-[11px] uppercase tracking-widest text-faint">
        Octavos → cuartos → semis → final
      </p>
      <div className="min-w-[54rem] py-1">
        <Branch
          output={
            <LaterNode
              title="Final"
              a="Ganador S1"
              b="Ganador S2"
              note="Sede LPF"
              involved={data.octavos.flatMap((match) => [
                match.home.team?.id,
                match.away.team?.id,
              ])}
              focusId={focusId}
              changed={Boolean(changedIds && changedIds.size > 0)}
            />
          }
        >
          <Branch
            output={
              <LaterNode
                title="S1"
                a="Ganador C1"
                b="Ganador C4"
                involved={idsIn(data, ["P1", "P8", "P4", "P5"])}
                focusId={focusId}
                changed={feedsChanged(changedIds, ["P1", "P8", "P4", "P5"])}
              />
            }
          >
            <Branch
              output={
                <LaterNode
                  title="C1"
                  a={feed(pick("P1"))}
                  b={feed(pick("P8"))}
                  involved={idsIn(data, ["P1", "P8"])}
                  focusId={focusId}
                  changed={feedsChanged(changedIds, ["P1", "P8"])}
                />
              }
            >
              {node("P1")}
              {node("P8")}
            </Branch>
            <Branch
              output={
                <LaterNode
                  title="C4"
                  a={feed(pick("P4"))}
                  b={feed(pick("P5"))}
                  involved={idsIn(data, ["P4", "P5"])}
                  focusId={focusId}
                  changed={feedsChanged(changedIds, ["P4", "P5"])}
                />
              }
            >
              {node("P4")}
              {node("P5")}
            </Branch>
          </Branch>
          <Branch
            output={
              <LaterNode
                title="S2"
                a="Ganador C2"
                b="Ganador C3"
                involved={idsIn(data, ["P2", "P7", "P3", "P6"])}
                focusId={focusId}
                changed={feedsChanged(changedIds, ["P2", "P7", "P3", "P6"])}
              />
            }
          >
            <Branch
              output={
                <LaterNode
                  title="C2"
                  a={feed(pick("P2"))}
                  b={feed(pick("P7"))}
                  involved={idsIn(data, ["P2", "P7"])}
                  focusId={focusId}
                  changed={feedsChanged(changedIds, ["P2", "P7"])}
                />
              }
            >
              {node("P2")}
              {node("P7")}
            </Branch>
            <Branch
              output={
                <LaterNode
                  title="C3"
                  a={feed(pick("P3"))}
                  b={feed(pick("P6"))}
                  involved={idsIn(data, ["P3", "P6"])}
                  focusId={focusId}
                  changed={feedsChanged(changedIds, ["P3", "P6"])}
                />
              }
            >
              {node("P3")}
              {node("P6")}
            </Branch>
          </Branch>
        </Branch>
      </div>
    </div>
  );
}

function Branch({ children, output }: { children: ReactNode; output: ReactNode }) {
  return (
    <div className="flex items-stretch">
      <div className="flex flex-col justify-around gap-2">{children}</div>
      <div className="bracket-join" aria-hidden />
      <div className="flex items-center">{output}</div>
    </div>
  );
}

function OctavosNode({
  match,
  focusId,
  onFocus,
  changed,
}: {
  match: KnockoutMatch;
  focusId: string | null;
  onFocus: (id: string) => void;
  changed: boolean;
}) {
  const active =
    focusId && (match.home.team?.id === focusId || match.away.team?.id === focusId);
  return (
    <article
      className={cn(
        "w-52 rounded-md bg-surface p-1.5 shadow-[0_0_0_1px_rgba(238,242,244,0.08)]",
        active && "shadow-[0_0_0_1px_rgba(126,182,212,0.7)]",
        changed && "shadow-[0_0_0_1px_rgba(126,182,212,0.55)]",
      )}
    >
      <p className="flex items-center justify-between gap-1 px-1 text-[10px] uppercase tracking-widest text-faint">
        <span>
          {match.id} · {match.home.seed}°{match.home.zone}–{match.away.seed}°{match.away.zone}
        </span>
        {changed ? <span className="text-accent">Cambió</span> : null}
      </p>
      <SideRow side={match.home} onFocus={onFocus} />
      <SideRow side={match.away} onFocus={onFocus} />
    </article>
  );
}

function SideRow({
  side,
  onFocus,
}: {
  side: KnockoutMatch["home"];
  onFocus: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-1.5 px-1 py-0.5"
      onClick={() => side.team && onFocus(side.team.id)}
    >
      <span className="w-4 text-center font-display text-[11px] text-muted">{side.seed}</span>
      <TeamMark team={side.team} size="sm" />
      <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold">
        {side.team?.short ?? "—"}
      </span>
    </button>
  );
}

function LaterNode({
  title,
  a,
  b,
  involved,
  focusId,
  changed,
  note,
}: {
  title: string;
  a: string;
  b: string;
  involved: Array<string | undefined>;
  focusId: string | null;
  changed?: boolean;
  note?: string;
}) {
  const active = Boolean(focusId && involved.includes(focusId));
  return (
    <article
      className={cn(
        "flex w-40 flex-col justify-center rounded-md bg-surface px-3 py-2 shadow-[0_0_0_1px_rgba(238,242,244,0.08)]",
        active && "shadow-[0_0_0_1px_rgba(126,182,212,0.7)]",
        changed && "shadow-[0_0_0_1px_rgba(126,182,212,0.55)]",
      )}
    >
      <p className="font-display text-xs tracking-wider text-muted">{title}</p>
      <p className="truncate text-sm font-medium">{a}</p>
      <p className="text-[11px] uppercase tracking-widest text-faint">vs</p>
      <p className="truncate text-sm font-medium">{b}</p>
      {note ? <p className="mt-1 text-[10px] text-faint">{note}</p> : null}
    </article>
  );
}

function feed(match: KnockoutMatch | undefined): string {
  if (!match) return "—";
  const home = match.home.team?.short ?? `${match.home.seed}°${match.home.zone}`;
  const away = match.away.team?.short ?? `${match.away.seed}°${match.away.zone}`;
  return `${home} / ${away}`;
}

function idsIn(data: PlayoffSnapshot, matchIds: string[]): Array<string | undefined> {
  return data.octavos
    .filter((match) => matchIds.includes(match.id))
    .flatMap((match) => [match.home.team?.id, match.away.team?.id]);
}

function feedsChanged(changedIds: Set<string> | undefined, matchIds: string[]): boolean {
  return Boolean(changedIds && matchIds.some((id) => changedIds.has(id)));
}
