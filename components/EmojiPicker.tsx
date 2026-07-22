"use client";

import { useEffect, useRef, useState } from "react";

const CATEGORIES: { label: string; emojis: string }[] = [
  {
    label: "Smileys",
    emojis:
      "😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺️😋😛😜🤪😝🤑🤗🤭🤫🤔😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😔🥲😢😭😱😨😰😥😓🤗🤤",
  },
  {
    label: "Gestures & people",
    emojis:
      "👋🤚🖐️✋🖖👌🤌🤏✌️🤞🫰🤟🤘👈👉👆👇☝️👍👎✊👊🤛🤜👏🙌👐🤲🙏🤝💪🦾🧠👀👁️👄👅💋",
  },
  {
    label: "Hearts",
    emojis: "❤️🧡💛💚💙💜🖤🤍🤎💔❤️‍🔥❤️‍🩹💕💞💓💗💖💘💝💟",
  },
  {
    label: "Animals & nature",
    emojis:
      "🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐢🐍🦖🐳🐬🐟🐙🦀🌵🌲🌳🌸🌻🌞🌈☀️⭐🌙⚡🔥💧",
  },
  {
    label: "Food",
    emojis:
      "🍏🍎🍊🍋🍌🍉🍇🍓🫐🍒🍑🥭🍍🥥🥝🍅🍆🥑🌽🥕🍕🍔🌭🥪🌮🌯🍜🍝🍣🍦🍩🍪🎂🍰🧁🍫🍬🍭☕🍺🍷🥤",
  },
  {
    label: "Activities & objects",
    emojis:
      "⚽🏀🏈⚾🎾🏐🎱🏓🏸🥊🎮🎲🎧🎵🎤🎬📷🎁🎉🎊✨💯🔥💦💤💬👀🚀🌍✈️🚗⏰📱💻🔒🔑💡",
  },
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  // No per-emoji keyword metadata to search against, so the search box just
  // jumps between category labels (e.g. "food") rather than pretending to
  // filter individual emoji — keeps the picker simple with no dataset to maintain.
  const visibleCategories = query.trim()
    ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
    : CATEGORIES;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Emoji"
        aria-label="Insert emoji"
        className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] text-lg transition hover:bg-surface ${
          open ? "bg-surface text-white" : "text-neutral-400"
        }`}
      >
        🙂
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 flex h-72 w-72 max-w-[85vw] flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-xl shadow-black/40">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="border-b border-border-subtle bg-transparent px-3 py-2 text-xs outline-none placeholder:text-neutral-500"
          />
          <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
            {(visibleCategories.length ? visibleCategories : CATEGORIES).map((cat) => (
              <div key={cat.label} className="mb-2">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {cat.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {Array.from(cat.emojis).map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      onClick={() => onSelect(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-surface-hover"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
