"use client";

import { useEffect, useRef, useState } from "react";
import { getMediaUrl, uploadMedia, ApiError, type MediaKind, type MediaMode } from "@/lib/api";
import EmojiPicker from "@/components/EmojiPicker";
import ImageLightbox from "@/components/ImageLightbox";

export type MediaRef = { id: string; kind: MediaKind; mode: MediaMode; viewed?: boolean };

export type ChatMessage = {
  text: string;
  at: string;
  fromSelf: boolean;
  fromEmail?: string;
  media?: MediaRef;
};

export type ChatSendInput = {
  text?: string;
  media?: { id: string; kind: MediaKind; mode: MediaMode };
};

const NAME_COLORS = ["#60a5fa", "#34d399", "#fb7185", "#c084fc", "#f0a020", "#2dd4bf"];

export function colorFor(email: string) {
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

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="2.5" width="6" height="10" rx="3" />
      <path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5" strokeLinecap="round" />
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

function PinIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <path d="M11.5 2.5l6 6-2 2-1-.3-3 3 .8 3-1.6 1.6-3.4-3.4-4 4-1-1 4-4L2.9 10 4.5 8.4l3 .8 3-3-.3-1z" />
    </svg>
  );
}

function GhostPhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="4" width="15" height="12" rx="2" strokeDasharray="2 2" />
      <circle cx="7" cy="8.5" r="1.2" />
      <path d="M4 14l4-4 3 3 2.5-2.5L17 14" />
    </svg>
  );
}

function GhostVideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="5" width="10" height="10" rx="2" strokeDasharray="2 2" />
      <path d="M12.5 9l5-3v8l-5-3" />
    </svg>
  );
}

function formatTime(at: string) {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayKey(at: string) {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDateSeparator(at: string) {
  const date = new Date(at);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(at) === dayKey(today.toISOString())) return "Today";
  if (dayKey(at) === dayKey(yesterday.toISOString())) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h12M8 6V4.5a1 1 0 011-1h2a1 1 0 011 1V6m-7 0l.7 9.1a1 1 0 001 .9h5.6a1 1 0 001-.9L14 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MediaBubble({
  media,
  fromSelf,
  at,
  revealed,
  onReveal,
}: {
  media: MediaRef;
  fromSelf: boolean;
  at: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  const [expired, setExpired] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isVideo = media.kind === "video";
  const isAudio = media.kind === "audio";
  const isOnce = media.mode === "once";
  const noun = isAudio ? "Voice message" : isVideo ? "Video" : "Photo";
  const verb = isAudio ? "listen" : "view";
  const rounding = fromSelf ? "rounded-br-sm" : "rounded-bl-sm";

  // Chrome writes an unseekable/unknown duration into webm blobs recorded
  // via MediaRecorder, so <audio> reports a bogus duration (e.g. a 4s clip
  // showing as 1:47) until something forces it to rescan. Seeking near the
  // end and back to 0 triggers that rescan — the standard workaround for
  // this well-known Chromium bug (crbug.com/642012).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function fixDuration() {
      if (!audio || Number.isFinite(audio.duration)) return;
      audio.currentTime = 1e101;
      const onTimeUpdate = () => {
        audio.currentTime = 0;
        audio.removeEventListener("timeupdate", onTimeUpdate);
      };
      audio.addEventListener("timeupdate", onTimeUpdate);
    }

    audio.addEventListener("loadedmetadata", fixDuration);
    return () => audio.removeEventListener("loadedmetadata", fixDuration);
  }, [media.id]);

  // "once" media the sender must never fetch — doing so would burn the
  // single view before the recipient even sees it (server enforces one
  // successful fetch per media id, sender included). So unlike every other
  // state here, the sender's own copy can't mirror the two-part visual
  // card at all — there's nothing safe to show a thumbnail of.
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
      <div className={`w-56 overflow-hidden rounded-2xl border border-border-subtle bg-surface ${rounding}`}>
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface-hover text-neutral-600">
          {isVideo ? <GhostVideoIcon /> : <GhostPhotoIcon />}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-2 text-[11.5px] text-neutral-500">
          <FlameIcon size={11} />
          You already {isAudio ? "listened to this" : "viewed this"}
        </div>
      </div>
    );
  }

  if (isOnce && !revealed) {
    return (
      <button
        type="button"
        onClick={onReveal}
        aria-label={`Tap to ${verb} — disappears after ${isAudio ? "playing" : "viewing"}`}
        className={`block w-56 overflow-hidden rounded-2xl border border-border-subtle bg-surface text-left ${rounding}`}
      >
        <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-black/10 to-black/40 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-[0_0_0_5px_rgba(240,160,32,0.15)]">
            <FlameIcon size={20} />
          </span>
          <span className="text-[11.5px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            Tap to {verb}
          </span>
          <span className="text-[10px] text-white/70">Disappears after {isAudio ? "playing" : "viewing"}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-2 text-[11.5px] text-amber-400">
          <FlameIcon size={11} />
          View once
        </div>
      </button>
    );
  }

  const src = getMediaUrl(media.id);

  if (isAudio) {
    return (
      <div className={`flex w-64 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface ${rounding}`}>
        <div className="flex items-center gap-2 p-2.5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-hover text-accent">
            <MicIcon />
          </span>
          <audio
            ref={audioRef}
            controls
            autoPlay={isOnce}
            src={src}
            className="h-9 flex-1"
            onError={() => isOnce && setExpired(true)}
          />
        </div>
        <div
          className={`flex items-center gap-1.5 border-t border-border-subtle px-2.5 py-2 text-[11.5px] ${
            isOnce ? "text-amber-400" : "text-neutral-500"
          }`}
        >
          {isOnce ? (
            <>
              <FlameIcon size={11} />
              Disappears after you close or leave this chat
            </>
          ) : (
            <>
              <span className="flex text-accent">
                <PinIcon />
              </span>
              Voice message · {formatTime(at)}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-56 overflow-hidden rounded-2xl border border-border-subtle bg-surface ${rounding}`}>
      {isVideo ? (
        <video
          src={src}
          controls
          autoPlay={isOnce}
          className="aspect-[4/3] max-h-64 w-full bg-black object-cover"
          onError={() => isOnce && setExpired(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onClick={() => setLightboxOpen(true)}
          className="aspect-[4/3] max-h-64 w-full cursor-zoom-in object-cover"
          onError={() => isOnce && setExpired(true)}
        />
      )}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-2 text-[11.5px] ${
          isOnce ? "text-amber-400" : "text-neutral-500"
        }`}
      >
        {isOnce ? (
          <>
            <FlameIcon size={11} />
            Disappears after you close or leave this chat
          </>
        ) : (
          <>
            <span className="flex text-accent">
              <PinIcon />
            </span>
            {noun} · {formatTime(at)}
          </>
        )}
      </div>
      {!isVideo && lightboxOpen && <ImageLightbox src={src} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}

export default function ChatPanel({
  messages,
  onSend,
  disabled,
  placeholder = "Type a message…",
  typingLabel,
  onTyping,
  lastReadLabel,
}: {
  messages: ChatMessage[];
  onSend: (input: ChatSendInput) => void;
  disabled: boolean;
  lastReadLabel?: string | null;
  placeholder?: string;
  typingLabel?: string | null;
  onTyping?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachMode, setAttachMode] = useState<MediaMode>("keep");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    return () => {
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el?.focus();
      if (el) el.selectionStart = el.selectionEnd = start + emoji.length;
      autoGrow();
    });
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

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  async function startRecording() {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        setAttachedFile(new File([blob], `voice-message.${ext}`, { type: blob.type }));
        setAttachMode("keep");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      setUploadError("Microphone unavailable");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    clearRecordingTimer();
  }

  function cancelRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.onstop = () => {
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
      };
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
    clearRecordingTimer();
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
  const isVoiceAttachment = attachedFile?.name.startsWith("voice-message");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface/40">
      <div ref={listRef} className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">No messages yet. Say hi!</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="flex flex-col gap-1">
            {(i === 0 || dayKey(m.at) !== dayKey(messages[i - 1].at)) && (
              <div className="my-1 flex items-center justify-center">
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">
                  {formatDateSeparator(m.at)}
                </span>
              </div>
            )}
            <div className={`flex flex-col gap-1 ${m.fromSelf ? "items-end" : "items-start"}`}>
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
                  at={m.at}
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
          </div>
        ))}
      </div>

      {typingLabel ? (
        <p className="px-3 pb-1 text-xs italic text-neutral-500">{typingLabel}</p>
      ) : (
        lastReadLabel && (
          <p className="px-3 pb-1 text-right text-[11px] text-neutral-500">{lastReadLabel}</p>
        )
      )}

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

        {recording ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-1.5">
            <span className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-red-500" />
            <span className="flex-1 text-xs font-medium text-red-300">
              Recording… {formatDuration(recordingSeconds)}
            </span>
            <button
              type="button"
              onClick={cancelRecording}
              aria-label="Cancel recording"
              className="flex-none rounded-md p-1.5 text-neutral-400 hover:bg-surface-hover hover:text-white"
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              aria-label="Stop recording"
              className="flex-none rounded-md bg-accent p-1.5 text-accent-foreground hover:bg-accent-hover"
            >
              <CheckIcon />
            </button>
          </div>
        ) : (
          attachedFile && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface p-2">
              <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[9px] bg-surface-hover text-neutral-400">
                {isVoiceAttachment ? (
                  <MicIcon />
                ) : attachedFile.type.startsWith("video") ? (
                  <VideoIcon />
                ) : (
                  <PhotoIcon />
                )}
              </span>
              <div className="min-w-0 flex-1 text-xs">
                <p className="truncate font-medium">
                  {isVoiceAttachment ? "Voice message" : attachedFile.name}
                </p>
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
          )
        )}

        {!recording && (
          <div className="flex flex-col gap-1.5">
            {/* Attach/emoji tools get their own row so they never compete
                with the textarea for width on narrow screens. */}
            <div className="flex items-center gap-1">
              <EmojiPicker onSelect={insertEmoji} />
              <button
                type="button"
                onClick={() => pickFile("photo")}
                disabled={disabled}
                title="Attach photo"
                aria-label="Attach photo"
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] border border-transparent text-neutral-400 transition hover:border-border-subtle hover:bg-surface hover:text-white disabled:opacity-40"
              >
                <PhotoIcon />
              </button>
              <button
                type="button"
                onClick={() => pickFile("video")}
                disabled={disabled}
                title="Attach video"
                aria-label="Attach video"
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] border border-transparent text-neutral-400 transition hover:border-border-subtle hover:bg-surface hover:text-white disabled:opacity-40"
              >
                <VideoIcon />
              </button>
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                title="Record a voice message"
                aria-label="Record a voice message"
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] border border-transparent text-neutral-400 transition hover:border-border-subtle hover:bg-surface hover:text-white disabled:opacity-40"
              >
                <MicIcon />
              </button>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  autoGrow();
                  if (e.target.value.trim().length > 0) onTyping?.();
                }}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                className="max-h-[120px] min-h-[38px] flex-1 resize-none rounded-[14px] border border-border-subtle bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex-none rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
              >
                {uploading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
