import { useCallback, useEffect, useState } from "react";
import type { PredictionMap, ScorePrediction } from "./types";

const KEY = "lallave-pred-v1";

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
        if (!next) delete copy[id];
        else copy[id] = { home: clamp(next.home), away: clamp(next.away) };
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

  const filled = Object.keys(predictions).length;
  return { predictions, setScore, clear, filled };
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(9, Math.round(n)));
}
