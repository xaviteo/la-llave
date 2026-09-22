import { createFileRoute } from "@tanstack/react-router";
import { PlayoffApp } from "@/components/playoff-app";
import { getPlayoffSnapshot } from "@/lib/playoffs/api";

export const Route = createFileRoute("/")({
  loader: () => getPlayoffSnapshot(),
  component: Home,
  pendingComponent: Pending,
});

function Home() {
  const initial = Route.useLoaderData();
  return <PlayoffApp initial={initial} />;
}

function Pending() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg text-fg">
      <p className="font-display text-2xl tracking-wide text-muted">Armando la llave…</p>
    </main>
  );
}
