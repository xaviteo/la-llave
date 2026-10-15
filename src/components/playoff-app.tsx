import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BracketView } from "@/components/editorial/bracket-view";
import { EditorialPageHeader, ScenarioSwitch } from "@/components/editorial/page-header";
import { ResultsView } from "@/components/editorial/results-view";
import { AppShell, type Vista } from "@/components/editorial/shell";
import { SimulationView } from "@/components/editorial/simulation-view";
import { StandingsView } from "@/components/editorial/standings-view";
import { ShareLlaveButton } from "@/components/share-llave-button";
import { getPlayoffSnapshot } from "@/lib/playoffs/api";
import { formatUpdatedStamp } from "@/lib/playoffs/format";
import { changedMatchIds, snapshotWithPredictions } from "@/lib/playoffs/logic";
import type { PlayoffSnapshot } from "@/lib/playoffs/types";
import { usePredictions } from "@/lib/playoffs/use-predictions";

export function PlayoffApp({
  initial,
  vista,
  onVista,
}: {
  initial: PlayoffSnapshot;
  vista: Vista;
  onVista: (vista: Vista) => void;
}) {
  const [presentation, setPresentation] = useState<"llave" | "lista" | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [source, setSource] = useState<"now" | "prediction">("now");
  const { predictions, setScore, clear, undo, canUndo, filled } = usePredictions();
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
  const showingPrediction = source === "prediction" && filled > 0;
  const data = showingPrediction ? predicted : live;
  const changedIds = useMemo(
    () => (showingPrediction ? changedMatchIds(live.octavos, predicted.octavos) : new Set<string>()),
    [showingPrediction, live.octavos, predicted.octavos],
  );
  const bracketMode = presentation ?? "llave";
  const scenarioSwitch = (
    <ScenarioSwitch value={source} filled={filled} onChange={setSource} />
  );
  const scenarioInBracket = vista === "cruces";

  const toggleFocus = (id: string) => {
    if (!id) return;
    setFocusId((prev) => (prev === id ? null : id));
  };

  return (
    <AppShell
      vista={vista}
      updated={formatUpdatedStamp(live.updatedAt)}
      live={live.live && !showingPrediction}
      fetching={query.isFetching}
      onRefresh={() => void query.refetch()}
      share={
        <ShareLlaveButton
          data={data}
          predicted={showingPrediction}
          live={live.live && !showingPrediction}
          projected={live.projected && !showingPrediction}
          changedIds={showingPrediction ? changedIds : undefined}
        />
      }
    >
      {query.isError ? (
        <p className="banner" role="status">
          No se pudo actualizar. Mostramos el último dato disponible.
        </p>
      ) : null}
      <EditorialPageHeader vista={vista} tournament={live.tournament} />
      {scenarioInBracket ? null : scenarioSwitch}
      {source === "prediction" && filled === 0 ? (
        <p className="banner">Cargá un resultado completo en Simular para mover la llave.</p>
      ) : null}
      {vista === "cruces" ? (
        <BracketView
          data={data}
          focusId={focusId}
          onFocus={toggleFocus}
          changedIds={changedIds}
          showingPrediction={showingPrediction}
          presentation={bracketMode}
          onPresentation={setPresentation}
          scenario={scenarioInBracket ? scenarioSwitch : null}
        />
      ) : null}
      {vista === "resultados" ? (
        <ResultsView
          data={live}
          focusId={focusId}
          onFocus={toggleFocus}
          stale={live.source === "fallback"}
          onCruces={() => onVista("cruces")}
        />
      ) : null}
      {vista === "tablas" ? (
        <StandingsView
          A={data.zones.A}
          B={data.zones.B}
          apertura={live.apertura ?? []}
          focusId={focusId}
          onFocus={toggleFocus}
          baseline={showingPrediction ? live.zones : undefined}
          predicted={showingPrediction}
          onCruces={() => onVista("cruces")}
        />
      ) : null}
      {vista === "simular" ? (
        <SimulationView
          live={live}
          predicted={predicted}
          predictions={predictions}
          focusId={focusId}
          onFocus={toggleFocus}
          onScore={(id, home, away) => {
            setScore(id, { home, away });
            setSource("prediction");
          }}
          onClear={() => {
            clear();
            setSource("now");
          }}
          onUndo={undo}
          canUndo={canUndo}
          onCruces={() => {
            if (filled > 0) setSource("prediction");
            onVista("cruces");
          }}
        />
      ) : null}
    </AppShell>
  );
}
