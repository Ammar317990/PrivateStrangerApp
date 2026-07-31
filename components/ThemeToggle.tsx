"use client";

import { useTheme } from "@/context/ThemeContext";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="3.5" />
      <path
        d="M10 2v2M10 16v2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M2 10h2M16 10h2M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 11.3A7 7 0 1 1 8.7 3a5.5 5.5 0 0 0 8.3 8.3Z" strokeLinejoin="round" />
    </svg>
  );
}

const DEFAULT_CLASSNAME =
  "flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border-subtle bg-surface text-neutral-400 transition hover:border-neutral-600 hover:text-foreground";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={className ?? DEFAULT_CLASSNAME}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
