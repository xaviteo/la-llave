import { useCallback, useEffect, useState } from "react";
import type { PredictionMap, ScorePrediction } from "./types";

const KEY = "lallave-pred-v2";

function readStored(): PredictionMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PredictionMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function usePredictions() {
  const [predictions, setPredictions] = useState<PredictionMap>({});

  useEffect(() => {
    setPredictions(readStored());
  }, []);

  const persist = useCallback((next: PredictionMap) => {
    setPredictions(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const setScore = useCallback(
    (id: string, next: ScorePrediction | null) => {
      setPredictions((prev) => {
        const copy = { ...prev };
        const home = next ? clamp(next.home) : null;
        const away = next ? clamp(next.away) : null;
        if (!next || (home === null && away === null)) delete copy[id];
        else copy[id] = { home, away };
        try {
          localStorage.setItem(KEY, JSON.stringify(copy));
        } catch {
          /* ignore */
        }
        return copy;
      });
    },
    [],
  );

  const clear = useCallback(() => persist({}), [persist]);

  const filled = Object.values(predictions).filter(
    (score) => score.home !== null && score.away !== null,
  ).length;
  return { predictions, setScore, clear, filled };
}

function clamp(n: number | null): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  return Math.max(0, Math.min(9, Math.round(n)));
}
