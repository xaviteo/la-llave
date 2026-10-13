import { createFileRoute } from "@tanstack/react-router";
import { PlayoffApp } from "@/components/playoff-app";
import type { Vista } from "@/components/editorial/shell";
import { getPlayoffSnapshot } from "@/lib/playoffs/api";

const VISTAS = ["cruces", "resultados", "tablas", "simular"] as const;

function readVista(value: unknown): Vista {
  return VISTAS.includes(value as Vista) ? (value as Vista) : "cruces";
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    vista: readVista(search.vista),
  }),
  loader: () => getPlayoffSnapshot(),
  component: Home,
  pendingComponent: Pending,
});

function Home() {
  const initial = Route.useLoaderData();
  const { vista } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PlayoffApp
      initial={initial}
      vista={vista}
      onVista={(next) => {
        void navigate({ search: { vista: next }, resetScroll: true });
      }}
    />
  );
}

function Pending() {
  return (
    <main className="shell" style={{ paddingBlock: 48 }}>
      <p className="page-sub">Cargando la fecha…</p>
    </main>
  );
}
