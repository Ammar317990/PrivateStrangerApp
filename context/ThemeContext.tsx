"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";

const THEME_COLOR: Record<Theme, string> = { dark: "#09090b", light: "#fafaf9" };

function writeTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private browsing, etc) — theme still applies
    // for this page load, it just won't persist across visits.
  }
  // The <meta name="theme-color"> tags in layout.tsx only track the OS's
  // prefers-color-scheme; an explicit in-app toggle needs to override that
  // directly so the mobile browser chrome matches what's on screen.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.setAttribute("content", THEME_COLOR[theme]));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Must start as "dark" to match what the server rendered (it has no
  // access to localStorage/matchMedia) — anything else here is a
  // hydration mismatch. The blocking script in layout.tsx already set
  // data-theme on <html> before paint, so the *visible* colors are
  // correct from frame one; this effect only corrects React's own state
  // to match afterward, and must NOT write back to the DOM/localStorage
  // itself — an effect that both reads and writes the same value on
  // mount will race and clobber the blocking script's value.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    queueMicrotask(() => {
      const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      setTheme(current);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      writeTheme(next);
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
