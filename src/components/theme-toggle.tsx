import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const THEME_KEY = "lallave-theme";
const LIGHT_CHROME = "#f3f6f8";
const DARK_CHROME = "#0c1014";

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

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useLayoutEffect(() => {
    const next = readTheme();
    applyTheme(next);
    setTheme(next);
  }, []);

  const light = theme === "light";

  return (
    <Button
      variant="outline"
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
      aria-pressed={light}
      aria-label={light ? "Activar modo oscuro" : "Activar modo claro"}
    >
      {light ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      {light ? "Claro" : "Oscuro"}
    </Button>
  );
}
