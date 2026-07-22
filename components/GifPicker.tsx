"use client";

import { useEffect, useRef, useState } from "react";
import { searchGifs, ApiError, type GifResult } from "@/lib/api";

export default function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function runSearch(q: string) {
    setLoading(true);
    setError(null);
    searchGifs(q)
      .then(({ results }) => setResults(results))
      .catch((err) => setError(err instanceof ApiError ? err.message : "GIF search failed"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open) return;
    // Deferred a tick so the state updates inside runSearch don't land
    // synchronously within the effect body (React flags that pattern).
    queueMicrotask(() => runSearch(""));
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 400);
  }

  function pick(url: string) {
    onSelect(url);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="GIF"
        aria-label="Send a GIF"
        className={`flex h-[38px] w-9 flex-none items-center justify-center rounded-lg text-[10px] font-bold tracking-tight transition hover:bg-surface ${
          open ? "bg-surface text-white" : "text-neutral-400"
        }`}
      >
        GIF
      </button>

      {open && (
        <div className="absolute bottom-11 left-0 z-30 flex h-80 w-80 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-xl shadow-black/40">
          <input
            autoFocus
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search GIFs…"
            className="border-b border-border-subtle bg-transparent px-3 py-2 text-xs outline-none placeholder:text-neutral-500"
          />
          <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
            {error && <p className="p-2 text-xs text-red-400">{error}</p>}
            {!error && loading && <p className="p-2 text-xs text-neutral-500">Searching…</p>}
            {!error && !loading && results.length === 0 && (
              <p className="p-2 text-xs text-neutral-500">No GIFs found.</p>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {results.map((gif) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={gif.id}
                  src={gif.previewUrl}
                  alt=""
                  onClick={() => pick(gif.url)}
                  className="aspect-square w-full cursor-pointer rounded-lg object-cover transition hover:opacity-80"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
