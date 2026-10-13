import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export const VISTAS = [
  { id: "cruces", label: "Cruces" },
  { id: "resultados", label: "Resultados" },
  { id: "tablas", label: "Tablas" },
  { id: "simular", label: "Simular" },
] as const;

export type Vista = (typeof VISTAS)[number]["id"];

export function AppShell({
  vista,
  updated,
  live,
  fetching,
  onRefresh,
  share,
  children,
}: {
  vista: Vista;
  updated: string;
  live: boolean;
  fetching: boolean;
  onRefresh: () => void;
  share: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-root">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="shell site-header-bar">
          <Link to="/" search={{ vista: "cruces" }} className="wordmark">
            pirata.app
          </Link>
          <nav className="primary-nav" aria-label="Secciones">
            {VISTAS.map((item) => (
              <Link
                key={item.id}
                to="/"
                search={{ vista: item.id }}
                aria-current={vista === item.id ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-tools">
            {live ? <span className="live-word desk-only">En vivo</span> : null}
            {updated ? <span className="updated-stamp desk-only">Actualizado {updated}</span> : null}
            <button type="button" className="btn btn-text desk-only" onClick={onRefresh} disabled={fetching}>
              {fetching ? "Actualizando…" : "Actualizar"}
            </button>
            <ThemeToggle className="desk-only" />
            {share}
          </div>
        </div>
        <div className="rule-double" />
      </header>
      <main id="contenido" className="shell">
        {children}
        <div className="colophon">
          <p style={{ margin: 0 }}>Desarrollado por el pirata JJCAB.</p>
          <div className="mobile-meta">
            {live ? <span className="live-word">En vivo</span> : null}
            <button type="button" className="btn btn-text" onClick={onRefresh} disabled={fetching}>
              {fetching ? "Actualizando…" : "Actualizar"}
            </button>
            <ThemeToggle />
          </div>
        </div>
        <div className="mobile-pad" />
      </main>
      <nav className="mobile-nav" aria-label="Secciones">
        {VISTAS.map((item) => (
          <Link
            key={item.id}
            to="/"
            search={{ vista: item.id }}
            aria-current={vista === item.id ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
