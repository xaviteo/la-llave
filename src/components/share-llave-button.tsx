import { Loader2, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { publishLlaveCard, renderLlavePng, type PublishResult } from "@/lib/playoffs/share-card";
import type { PlayoffSnapshot } from "@/lib/playoffs/types";

const NOTE: Record<Exclude<PublishResult, "cancelled">, string> = {
  shared: "Lista para enviar",
  copied: "Imagen copiada",
  downloaded: "Imagen descargada",
};

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

  return (
    <Button
      className={className}
      disabled={busy}
      aria-live="polite"
      onClick={() => {
        setBusy(true);
        setNote("");
        void renderLlavePng(data, { predicted, live, projected, changedIds })
          .then((blob) => publishLlaveCard(blob))
          .then((result) => {
            if (result !== "cancelled") setNote(NOTE[result]);
          })
          .catch(() => setNote("No se pudo armar"))
          .finally(() => {
            setBusy(false);
            if (timer.current) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setNote(""), 4000);
          });
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      {busy ? "Armando…" : note || "Compartir llave"}
    </Button>
  );
}
