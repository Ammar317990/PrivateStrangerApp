"use client";

import { useState } from "react";

export default function DirectChatStarter({
  disabled,
  connecting,
  error,
  onStart,
}: {
  disabled: boolean;
  connecting: boolean;
  error: string | null;
  onStart: (email: string) => void;
}) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || disabled || connecting) return;
    onStart(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-border-subtle bg-surface/40 p-8 text-center"
    >
      <p className="text-neutral-300">Or chat with someone specific</p>
      <div className="flex w-full max-w-xs gap-2">
        <input
          type="email"
          required
          placeholder="their@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled || connecting}
          className="flex-1 rounded-lg border border-border-subtle bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || connecting || !email.trim()}
          className="rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-medium transition hover:border-neutral-600 disabled:opacity-50"
        >
          {connecting ? "Connecting…" : "Chat"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
