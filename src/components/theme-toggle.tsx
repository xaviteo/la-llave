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
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? LIGHT_CHROME : DARK_CHROME);
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
      className={`btn btn-text ${className}`.trim()}
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
      {light ? "Oscuro" : "Claro"}
    </button>
  );
}
