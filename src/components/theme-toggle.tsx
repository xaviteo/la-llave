import { useLayoutEffect, useState } from "react";

const THEME_KEY = "lallave-theme";
const LIGHT_CHROME = "#B2CFD6";
const DARK_CHROME = "#101719";

function readTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage blocked */
  }
  return "light";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? LIGHT_CHROME : DARK_CHROME);
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="2.35" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.3v1.7M8 13v1.7M1.3 8h1.7M13 8h1.7M3.1 3.1l1.2 1.2M11.7 11.7l1.2 1.2M12.9 3.1l-1.2 1.2M4.3 11.7l-1.2 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M9.6 1.7a5.4 5.4 0 1 0 4.3 8.2A4.5 4.5 0 0 1 9.6 1.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useLayoutEffect(() => {
    const next = readTheme();
    applyTheme(next);
    setTheme(next);
  }, []);

  const light = theme === "light";

  return (
    <button
      type="button"
      className={`theme-switch ${className}`.trim()}
      aria-label={light ? "Activar tema oscuro" : "Activar tema claro"}
      aria-pressed={!light}
      onClick={() => {
        const next = light ? "dark" : "light";
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          /* storage blocked */
        }
        applyTheme(next);
        setTheme(next);
      }}
    >
      <span className={light ? "is-on" : undefined}>
        <SunIcon />
      </span>
      <span className={light ? undefined : "is-on"}>
        <MoonIcon />
      </span>
    </button>
  );
}
