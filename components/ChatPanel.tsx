"use client";

import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  text: string;
  at: string;
  fromSelf: boolean;
};

export default function ChatPanel({
  messages,
  onSend,
  disabled,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface/40">
      <div
        ref={listRef}
        className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">No messages yet. Say hi!</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
              m.fromSelf
                ? "ml-auto rounded-br-sm bg-accent text-accent-foreground"
                : "rounded-bl-sm bg-surface-hover text-neutral-100"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border-subtle p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Not connected" : "Type a message…"}
          className="flex-1 rounded-lg border border-border-subtle bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
