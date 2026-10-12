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
    <div className="no-scrollbar overflow-x-auto pb-1">
      <div className="min-w-[58rem] py-2">
        <Branch
          toFinal
          output={
            <LaterNode
              title="Final"
              a="Ganador S1"
              b="Ganador S2"
              note="Sede LPF"
              cup
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

function Branch({
  children,
  output,
  toFinal = false,
}: {
  children: ReactNode;
  output: ReactNode;
  toFinal?: boolean;
}) {
  return (
    <div className="flex items-stretch">
      <div className="flex flex-col justify-around gap-3">{children}</div>
      <div className={cn("bracket-join", toFinal && "bracket-join-final")} aria-hidden />
      <div className="flex items-center">{output}</div>
    </div>
  );
}

function Copa() {
  return (
    <svg viewBox="0 0 64 72" className="mx-auto h-16 w-14" aria-hidden>
      <path
        d="M20 8h24v10c0 10-5 18-12 20-7-2-12-10-12-20V8z"
        fill="#e4c36a"
        stroke="#6e5214"
        strokeWidth="1.6"
      />
      <path d="M26 12c1 8 2 14 2 18" fill="none" stroke="#fff4cc" strokeWidth="1.6" opacity="0.8" />
      <path
        d="M20 14h-7c-4 0-7 3.2-7 7.2S9.2 28 14 28h6"
        fill="none"
        stroke="#e4c36a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M44 14h7c4 0 7 3.2 7 7.2S54.8 28 50 28h-6"
        fill="none"
        stroke="#e4c36a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M29 38h6l-1 10h-4l-1-10z" fill="#c9a44a" stroke="#6e5214" strokeWidth="1" />
      <path d="M20 50h24l-3 8H23l-3-8z" fill="#e4c36a" stroke="#6e5214" strokeWidth="1.4" />
      <path d="M18 62h28v3.5H18z" fill="#6e5214" />
    </svg>
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
        "w-60 border border-fg/15 bg-bg",
        (active || changed) && "border-accent",
      )}
    >
      <p className="flex items-center justify-between gap-2 px-2 pt-1.5 text-[10px] text-faint">
        <span className="font-display tracking-wide">{match.label}</span>
        {changed ? <span className="text-accent">Cambió</span> : null}
      </p>
      <SideRow side={match.home} host onFocus={onFocus} focusId={focusId} />
      <div className="mx-2 border-t border-fg/10" />
      <SideRow side={match.away} onFocus={onFocus} focusId={focusId} />
    </article>
  );
}

function SideRow({
  side,
  host = false,
  focusId,
  onFocus,
}: {
  side: KnockoutMatch["home"];
  host?: boolean;
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  const active = Boolean(side.team && focusId === side.team.id);
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-left",
        active && "bg-surface-2",
      )}
      onClick={() => side.team && onFocus(side.team.id)}
    >
      <span className="h-7 w-1 shrink-0" style={{ background: side.team?.color ?? "transparent" }} />
      <TeamMark team={side.team} size="md" />
      <span className="min-w-0 flex-1 truncate font-display text-base tracking-wide">
        {side.team?.short ?? "—"}
      </span>
      <span className="font-display text-xs text-muted">
        {side.seed}°{host ? " L" : ""}
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
  cup = false,
}: {
  title: string;
  a: string;
  b: string;
  involved: Array<string | undefined>;
  focusId: string | null;
  changed?: boolean;
  note?: string;
  cup?: boolean;
}) {
  const active = Boolean(focusId && involved.includes(focusId));
  if (cup) {
    return (
      <article
        className={cn(
          "flex w-48 flex-col items-center border border-[#c6a24e] bg-bg px-3 py-3 text-center",
          (active || changed) && "bg-surface",
        )}
      >
        <Copa />
        <p className="mt-1 font-display text-[11px] tracking-[0.28em] text-muted">FINAL</p>
        <p className="mt-2 w-full truncate font-display text-lg tracking-wide">{a}</p>
        <p className="text-[10px] text-faint">vs</p>
        <p className="w-full truncate font-display text-lg tracking-wide">{b}</p>
        {note ? <p className="mt-2 text-[10px] text-faint">{note}</p> : null}
      </article>
    );
  }
  return (
    <article
      className={cn(
        "flex w-40 flex-col justify-center border border-fg/15 bg-bg px-3 py-2",
        (active || changed) && "border-accent",
      )}
    >
      <p className="font-display text-[11px] tracking-[0.18em] text-faint">{title}</p>
      <p className="truncate font-display text-base tracking-wide">{a}</p>
      <p className="text-[10px] text-faint">vs</p>
      <p className="truncate font-display text-base tracking-wide">{b}</p>
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
