import { seasonLine } from "@/lib/playoffs/format";
import type { Vista } from "@/components/editorial/shell";

const COPY: Record<Vista, { title: string; rest: string | null }> = {
  cruces: { title: "Todo por la copa.", rest: "el camino a la final." },
  resultados: { title: "La fecha, al día.", rest: "resultados y próximos partidos." },
  tablas: { title: "Los que van por la copa.", rest: "posiciones por zona." },
  simular: { title: "Jugá con el destino.", rest: null },
};

export function EditorialPageHeader({ vista, tournament }: { vista: Vista; tournament: string }) {
  const copy = COPY[vista];
  const sub =
    copy.rest === null
      ? "Probá resultados. Mirá cómo cambia el camino."
      : seasonLine(tournament, copy.rest);
  return (
    <header className="page-hero">
      <div className="page-hero-row">
        <div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-sub">{sub}</p>
        </div>
        <p className="kicker">
          Fútbol
          <br />
          argentino
          <br />
          todo el año.
        </p>
      </div>
    </header>
  );
}

export function ScenarioSwitch({
  value,
  filled,
  onChange,
}: {
  value: "now" | "prediction";
  filled: number;
  onChange: (value: "now" | "prediction") => void;
}) {
  return (
    <div className="scenario" role="group" aria-label="Escenario">
      <button type="button" aria-pressed={value === "now"} onClick={() => onChange("now")}>
        Actual
      </button>
      <span className="switch-slash" aria-hidden>
        /
      </span>
      <button type="button" aria-pressed={value === "prediction"} onClick={() => onChange("prediction")}>
        Mi simulación{filled > 0 ? ` (${filled})` : ""}
      </button>
    </div>
  );
}
