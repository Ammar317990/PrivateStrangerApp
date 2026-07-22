"use client";

import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  text: string;
  at: string;
  fromSelf: boolean;
  fromEmail?: string;
};

const NAME_COLORS = ["#60a5fa", "#34d399", "#fb7185", "#c084fc", "#f0a020", "#2dd4bf"];

function colorFor(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return NAME_COLORS[hash % NAME_COLORS.length];
}

const MAX_TEXTAREA_HEIGHT = 120;

export default function ChatPanel({
  messages,
  onSend,
  disabled,
  placeholder = "Type a message…",
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
  }

  function send() {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft("");
    requestAnimationFrame(autoGrow);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
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
          <div key={i} className={`flex flex-col ${m.fromSelf ? "items-end" : "items-start"}`}>
            {!m.fromSelf && m.fromEmail && (
              <span
                className="mb-0.5 px-1 text-xs font-semibold"
                style={{ color: colorFor(m.fromEmail) }}
              >
                {m.fromEmail}
              </span>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm ${
                m.fromSelf
                  ? "rounded-br-sm bg-accent text-accent-foreground"
                  : "rounded-bl-sm bg-surface-hover text-neutral-100"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border-subtle p-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Not connected" : placeholder}
          className="max-h-[120px] min-h-[38px] flex-1 resize-none rounded-lg border border-border-subtle bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
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
