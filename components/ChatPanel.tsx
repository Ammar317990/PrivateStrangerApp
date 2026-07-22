"use client";

import { useEffect, useRef, useState } from "react";
import { getMediaUrl, uploadMedia, ApiError, type MediaKind, type MediaMode } from "@/lib/api";

export type MediaRef = { id: string; kind: MediaKind; mode: MediaMode; viewed?: boolean };

export type ChatMessage = {
  text: string;
  at: string;
  fromSelf: boolean;
  fromEmail?: string;
  media?: MediaRef;
};

export type ChatSendInput = { text?: string; media?: { id: string; kind: MediaKind; mode: MediaMode } };

const NAME_COLORS = ["#60a5fa", "#34d399", "#fb7185", "#c084fc", "#f0a020", "#2dd4bf"];

function colorFor(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return NAME_COLORS[hash % NAME_COLORS.length];
}

const MAX_TEXTAREA_HEIGHT = 120;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="4" width="15" height="12" rx="2" />
      <circle cx="7" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M4 14l4-4 3 3 2.5-2.5L17 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="5" width="10" height="10" rx="2" />
      <path d="M12.5 9l5-3v8l-5-3" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2c1 2.2-.3 3.2-1.2 4.3C7.8 7.5 7 8.7 7 10.3A3 3 0 0010 13.3a3 3 0 003-3c0-.9-.4-1.5-.8-2.1 1 .5 2.3 1.8 2.3 3.9A4.5 4.5 0 0110 16.6a4.5 4.5 0 01-4.5-4.5C5.5 8.4 7.6 6.6 8.8 5c.7-1 1.1-1.9 1.2-3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

function MediaBubble({
  media,
  fromSelf,
  revealed,
  onReveal,
}: {
  media: MediaRef;
  fromSelf: boolean;
  revealed: boolean;
  onReveal: () => void;
}) {
  const [expired, setExpired] = useState(false);
  const isVideo = media.kind === "video";
  const isOnce = media.mode === "once";

  // "once" media the sender must never fetch — doing so would burn the
  // single view before the recipient even sees it (server enforces one
  // successful fetch per media id, sender included).
  if (isOnce && fromSelf) {
    return (
      <div className="flex items-center gap-1.5 rounded-2xl rounded-br-sm bg-accent/80 px-3 py-2 text-xs font-medium text-accent-foreground">
        <FlameIcon />
        View once · Sent
      </div>
    );
  }

  const alreadyGone = isOnce && (media.viewed || expired);

  if (isOnce && alreadyGone) {
    return (
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border-subtle bg-surface px-3 py-2 text-xs text-neutral-500">
        <FlameIcon />
        {isVideo ? "Video" : "Photo"} already viewed
      </div>
    );
  }

  if (isOnce && !revealed) {
    return (
      <button
        type="button"
        onClick={onReveal}
        className={`flex w-48 flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 py-6 text-center transition hover:bg-amber-400/15 ${
          fromSelf ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-amber-950">
          <FlameIcon size={18} />
        </span>
        <span className="text-xs font-semibold">Tap to view</span>
        <span className="text-[11px] text-neutral-400">Disappears after viewing</span>
      </button>
    );
  }

  const src = getMediaUrl(media.id);
  const rounding = fromSelf ? "rounded-br-sm" : "rounded-bl-sm";

  return (
    <div className={`w-56 overflow-hidden rounded-2xl border border-border-subtle bg-surface ${rounding}`}>
      {isVideo ? (
        <video
          src={src}
          controls
          autoPlay={isOnce}
          className="max-h-64 w-full bg-black"
          onError={() => isOnce && setExpired(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="max-h-64 w-full object-cover"
          onError={() => isOnce && setExpired(true)}
        />
      )}
      {isOnce && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-amber-400">
          <FlameIcon size={11} />
          Disappears after you close or leave this chat
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({
  messages,
  onSend,
  disabled,
  placeholder = "Type a message…",
}: {
  messages: ChatMessage[];
  onSend: (input: ChatSendInput) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachMode, setAttachMode] = useState<MediaMode>("keep");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
  }

  function pickFile(kind: MediaKind) {
    setUploadError(null);
    (kind === "photo" ? photoInputRef : videoInputRef).current?.click();
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is too large (25MB max)");
      return;
    }
    setUploadError(null);
    setAttachedFile(file);
    setAttachMode("keep");
  }

  async function send() {
    const text = draft.trim();
    if (disabled || uploading || (!text && !attachedFile)) return;

    let media: ChatSendInput["media"];

    if (attachedFile) {
      setUploading(true);
      setUploadError(null);
      try {
        media = await uploadMedia(attachedFile, attachMode);
      } catch (err) {
        setUploadError(err instanceof ApiError ? err.message : "Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSend({ text: text || undefined, media });
    setDraft("");
    setAttachedFile(null);
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

  const canSend = !disabled && !uploading && (draft.trim().length > 0 || attachedFile !== null);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface/40">
      <div ref={listRef} className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">No messages yet. Say hi!</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 ${m.fromSelf ? "items-end" : "items-start"}`}>
            {!m.fromSelf && m.fromEmail && (
              <span
                className="mb-0.5 px-1 text-xs font-semibold"
                style={{ color: colorFor(m.fromEmail) }}
              >
                {m.fromEmail}
              </span>
            )}
            {m.media && (
              <MediaBubble
                media={m.media}
                fromSelf={m.fromSelf}
                revealed={revealed.has(i)}
                onReveal={() => setRevealed((prev) => new Set(prev).add(i))}
              />
            )}
            {m.text && (
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm ${
                  m.fromSelf
                    ? "rounded-br-sm bg-accent text-accent-foreground"
                    : "rounded-bl-sm bg-surface-hover text-neutral-100"
                }`}
              >
                {m.text}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border-subtle p-2">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePicked}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFilePicked}
        />

        {uploadError && <p className="px-1 text-xs text-red-400">{uploadError}</p>}

        {attachedFile && (
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface p-1.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-surface-hover text-neutral-400">
              {attachedFile.type.startsWith("video") ? <VideoIcon /> : <PhotoIcon />}
            </span>
            <div className="min-w-0 flex-1 text-xs">
              <p className="truncate font-medium">{attachedFile.name}</p>
              <p className="text-neutral-500">
                {attachMode === "once" ? "Sends as view once" : "Sends and stays in the thread"}
              </p>
            </div>
            <div className="flex flex-none rounded-full border border-border-subtle bg-background p-0.5">
              <button
                type="button"
                onClick={() => setAttachMode("keep")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  attachMode === "keep" ? "bg-accent/20 text-accent" : "text-neutral-500"
                }`}
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => setAttachMode("once")}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  attachMode === "once" ? "bg-amber-400/20 text-amber-400" : "text-neutral-500"
                }`}
              >
                <FlameIcon size={11} /> Once
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="flex-none rounded-md p-1.5 text-neutral-500 hover:bg-surface-hover hover:text-white"
              aria-label="Remove attachment"
            >
              <XIcon />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => pickFile("photo")}
            disabled={disabled}
            title="Attach photo"
            aria-label="Attach photo"
            className="flex h-[38px] w-9 flex-none items-center justify-center rounded-lg text-neutral-400 transition hover:bg-surface hover:text-white disabled:opacity-40"
          >
            <PhotoIcon />
          </button>
          <button
            type="button"
            onClick={() => pickFile("video")}
            disabled={disabled}
            title="Attach video"
            aria-label="Attach video"
            className="flex h-[38px] w-9 flex-none items-center justify-center rounded-lg text-neutral-400 transition hover:bg-surface hover:text-white disabled:opacity-40"
          >
            <VideoIcon />
          </button>
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
            disabled={!canSend}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
          >
            {uploading ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
