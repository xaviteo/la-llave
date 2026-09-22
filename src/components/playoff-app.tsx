import { useQuery } from "@tanstack/react-query";
import { Radio, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { BracketBoard } from "@/components/bracket-board";
import { BracketTree } from "@/components/bracket-tree";
import { HowItWorks } from "@/components/how-it-works";
import { MatchStrip } from "@/components/match-strip";
import { PredictionPanel } from "@/components/prediction-panel";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ZoneTables } from "@/components/zone-table";
import { getPlayoffSnapshot } from "@/lib/playoffs/api";
import { relativeUpdated } from "@/lib/playoffs/format";
import { changedMatchIds, snapshotWithPredictions } from "@/lib/playoffs/logic";
import type { PlayoffSnapshot } from "@/lib/playoffs/types";
import { usePredictions } from "@/lib/playoffs/use-predictions";

export function PlayoffApp({ initial }: { initial: PlayoffSnapshot }) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [layout, setLayout] = useState<"cards" | "tree">("cards");
  const [source, setSource] = useState<"now" | "prediction">("now");
  const { predictions, setScore, clear, filled } = usePredictions();
  const query = useQuery({
    queryKey: ["playoffs"],
    queryFn: () => getPlayoffSnapshot(),
    initialData: initial,
    refetchInterval: (current) => (current.state.data?.live ? 20_000 : 60_000),
  });
  const live = query.data ?? initial;
  const predicted = useMemo(
    () => snapshotWithPredictions(live, predictions),
    [live, predictions],
  );
  const data = source === "prediction" && filled > 0 ? predicted : live;
  const showingPrediction = source === "prediction" && filled > 0;
  const changedIds = useMemo(
    () => (showingPrediction ? changedMatchIds(live.octavos, predicted.octavos) : new Set<string>()),
    [showingPrediction, live.octavos, predicted.octavos],
  );

  const toggleFocus = (id: string) => {
    setFocusId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-dvh bg-bg pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              Liga Profesional
            </p>
            <h1 className="font-display text-3xl leading-none tracking-wide">La Llave</h1>
            <p className="mt-1 text-sm text-muted">
              {live.tournament} · {live.roundLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {live.live ? (
              <span className="inline-flex h-11 items-center gap-2 rounded-full bg-live/15 px-3 text-xs font-semibold uppercase tracking-wide text-live">
                <Radio className="live-dot size-3.5" />
                En vivo
              </span>
            ) : null}
            <Button
              variant="outline"
              size="default"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className={query.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
              Actualizar
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pb-3">
          <Segmented
            value={source}
            onChange={setSource}
            options={[
              { value: "now", label: "Ahora" },
              { value: "prediction", label: filled ? `Predicción (${filled})` : "Predicción" },
            ]}
          />
          <Segmented
            value={layout}
            onChange={setLayout}
            options={[
              { value: "cards", label: "Cruces" },
              { value: "tree", label: "Llave" },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-16">
        <MatchStrip data={live} focusId={focusId} onFocus={toggleFocus} />

        {showingPrediction ? (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
            Escenario con {filled} resultado{filled === 1 ? "" : "s"} cargado
            {filled === 1 ? "" : "s"}
            {changedIds.size
              ? ` · ${changedIds.size} cruce${changedIds.size === 1 ? "" : "s"} distinto${changedIds.size === 1 ? "" : "s"}`
              : ""}
            . La pestaña Ahora sigue mostrando los cruces reales.
          </p>
        ) : source === "prediction" ? (
          <p className="text-sm text-muted">
            Cargá resultados abajo para ver cómo se movería la llave.
          </p>
        ) : null}

        {layout === "tree" ? (
          <section>
            <h2 className="mb-3 font-display text-2xl tracking-wide">
              {showingPrediction ? "Llave, si se da tu predicción" : "Llave, ahora"}
            </h2>
            <BracketTree
              data={data}
              focusId={focusId}
              onFocus={toggleFocus}
              changedIds={changedIds}
            />
          </section>
        ) : (
          <BracketBoard
            data={data}
            focusId={focusId}
            onFocus={toggleFocus}
            title={showingPrediction ? "Octavos, si se da tu predicción" : "Octavos, ahora"}
            changedIds={changedIds}
            showLiveBadge={!showingPrediction}
          />
        )}

        <PredictionPanel
          data={live}
          predictions={predictions}
          onScore={(id, home, away) => {
            setScore(id, { home, away });
            setSource("prediction");
          }}
          onClearMatch={(id) => setScore(id, null)}
          onClear={() => {
            clear();
            setSource("now");
          }}
        />

        <ZoneTables
          A={data.zones.A}
          B={data.zones.B}
          focusId={focusId}
          onFocus={toggleFocus}
          baseline={showingPrediction ? live.zones : undefined}
          predicted={showingPrediction}
        />
        <HowItWorks />
        <p className="text-center text-xs text-faint">
          Actualizado {relativeUpdated(live.updatedAt)}
          {live.source === "fallback" ? " · última tabla conocida" : " · datos ESPN"}
          {live.projected && !showingPrediction ? " · incluye marcador en curso" : ""}
          {showingPrediction ? " · tablas según tu predicción" : ""}
          . Tocá un club para seguirlo en la llave y en la tabla.
        </p>
      </main>
    </div>
  );
}
