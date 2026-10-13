import { useEffect, useRef, useState } from "react";
import {
  prefersShareSheet,
  publishLlaveCard,
  renderLlavePng,
  type PublishResult,
} from "@/lib/playoffs/share-card";
import type { PlayoffSnapshot } from "@/lib/playoffs/types";

const NOTE: Record<Exclude<PublishResult, "cancelled" | "wait">, string> = {
  shared: "Lista para enviar",
  copied: "Imagen copiada",
  downloaded: "Imagen descargada",
};

type Cache = { key: string; blob: Blob | null; pending: Promise<Blob> | null };

function signatureOf(
  data: PlayoffSnapshot,
  predicted: boolean,
  live: boolean,
  projected: boolean,
  changedIds: ReadonlySet<string> | undefined,
): string {
  const board = data.octavos
    .map((match) =>
      [
        match.id,
        match.home.team?.id ?? "",
        match.home.seed,
        match.away.team?.id ?? "",
        match.away.seed,
        match.label,
      ].join(":"),
    )
    .join("|");
  const changed = [...(changedIds ?? [])].sort().join(",");
  return [data.updatedAt, data.tournament, data.roundLabel, predicted, live, projected, board, changed].join(
    "~",
  );
}

export function ShareLlaveButton({
  data,
  predicted,
  live,
  projected,
  changedIds,
  className,
}: {
  data: PlayoffSnapshot;
  predicted: boolean;
  live: boolean;
  projected: boolean;
  changedIds?: ReadonlySet<string>;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const timer = useRef<number | null>(null);
  const cache = useRef<Cache>({ key: "", blob: null, pending: null });
  const key = signatureOf(data, predicted, live, projected, changedIds);

  function remember(next: string) {
    setNote(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(""), 4000);
  }

  function start(): Promise<Blob> {
    const current = cache.current;
    if (current.key === key && current.blob) return Promise.resolve(current.blob);
    if (current.key === key && current.pending) return current.pending;
    const pending = renderLlavePng(data, { predicted, live, projected, changedIds }).then((blob) => {
      if (cache.current.pending === pending) cache.current = { key, blob, pending: null };
      return blob;
    });
    cache.current = { key, blob: null, pending };
    return pending;
  }

  useEffect(() => {
    let alive = true;
    void start().catch(() => {
      if (alive && cache.current.key === key) cache.current.pending = null;
    });
    return () => {
      alive = false;
    };
    // start() closes over the latest board. key already covers those inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <button
      type="button"
      className={`btn btn-text ${className ?? ""}`.trim()}
      disabled={busy}
      aria-live="polite"
      onClick={() => {
        setNote("");
        const ready = cache.current.key === key ? cache.current.blob : null;
        if (prefersShareSheet() && !ready) {
          setBusy(true);
          void start()
            .then(() => remember("Tocá de nuevo"))
            .catch(() => remember("No se pudo armar"))
            .finally(() => setBusy(false));
          return;
        }
        setBusy(true);
        const source = ready ?? start();
        void publishLlaveCard(source)
          .then((result) => {
            if (result === "cancelled") return;
            if (result === "wait") {
              remember("Tocá de nuevo");
              return;
            }
            remember(NOTE[result]);
          })
          .catch(() => remember("No se pudo armar"))
          .finally(() => setBusy(false));
      }}
    >
      {busy ? "Armando…" : note || "Compartir"}
    </button>
  );
}
