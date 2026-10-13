import { useCallback, useEffect, useRef, useState } from "react";
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

function applyScore(prev: PredictionMap, id: string, next: ScorePrediction | null): PredictionMap {
  const copy = { ...prev };
  const home = next ? clamp(next.home) : null;
  const away = next ? clamp(next.away) : null;
  if (!next || (home === null && away === null)) delete copy[id];
  else copy[id] = { home, away };
  return copy;
}

function sameMap(a: PredictionMap, b: PredictionMap): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key]?.home !== b[key]?.home || a[key]?.away !== b[key]?.away) return false;
  }
  return true;
}

export function usePredictions() {
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [undoCount, setUndoCount] = useState(0);
  const history = useRef<PredictionMap[]>([]);

  useEffect(() => {
    setPredictions(readStored());
    history.current = [];
    setUndoCount(0);
  }, []);

  const persist = useCallback((next: PredictionMap) => {
    setPredictions(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const remember = useCallback((prev: PredictionMap) => {
    const last = history.current[history.current.length - 1];
    if (last && sameMap(last, prev)) return;
    history.current = [...history.current, prev].slice(-40);
    setUndoCount(history.current.length);
  }, []);

  const setScore = useCallback(
    (id: string, next: ScorePrediction | null) => {
      setPredictions((prev) => {
        const copy = applyScore(prev, id, next);
        if (sameMap(prev, copy)) return prev;
        queueMicrotask(() => {
          remember(prev);
          try {
            localStorage.setItem(KEY, JSON.stringify(copy));
          } catch {
            /* ignore quota */
          }
        });
        return copy;
      });
    },
    [remember],
  );

  const clear = useCallback(() => {
    setPredictions((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      queueMicrotask(() => {
        remember(prev);
        try {
          localStorage.setItem(KEY, JSON.stringify({}));
        } catch {
          /* ignore quota */
        }
      });
      return {};
    });
  }, [remember]);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    setUndoCount(history.current.length);
    if (!prev) return;
    persist(prev);
  }, [persist]);

  const filled = Object.values(predictions).filter(
    (score) => score.home !== null && score.away !== null,
  ).length;
  return { predictions, setScore, clear, undo, canUndo: undoCount > 0, filled };
}

function clamp(n: number | null): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  return Math.max(0, Math.min(9, Math.round(n)));
}
