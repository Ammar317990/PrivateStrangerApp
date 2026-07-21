"use client";

import { useEffect, useRef, useState } from "react";

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <rect x="5" y="4" width="3.5" height="12" rx="1" />
      <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6 4.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

function VideoTile({
  stream,
  label,
  muted,
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [blockedByAutoplay, setBlockedByAutoplay] = useState(false);

  // A new stream (reconnect, new match, etc.) should always start live —
  // reset during render (React's recommended pattern for state that
  // depends on a prop) rather than in an effect, which would cause an
  // extra cascading render.
  const [prevStream, setPrevStream] = useState(stream);
  if (stream !== prevStream) {
    setPrevStream(stream);
    setPaused(false);
    setBlockedByAutoplay(false);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      if (stream) {
        // autoPlay can be silently blocked by the browser (e.g. an
        // unmuted remote video without a fresh user gesture) — detect
        // that instead of leaving a blank frame with no explanation.
        video.play().catch(() => setBlockedByAutoplay(true));
      }
    }
  }, [stream]);

  function enablePlayback() {
    videoRef.current?.play().then(() => setBlockedByAutoplay(false)).catch(() => {});
  }

  function togglePause() {
    const video = videoRef.current;
    if (!video) return;

    if (paused) {
      video.play().catch(() => {});
    } else {
      // Pausing a live-stream <video> leaves its last decoded frame on
      // screen, which is exactly the "freeze where it was left" effect —
      // no canvas snapshot needed.
      video.pause();
    }
    setPaused((p) => !p);
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover transition-[filter] duration-300 ${
          paused ? "blur-lg" : ""
        }`}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-600">
          Waiting for video…
        </div>
      )}
      {stream && blockedByAutoplay && (
        <button
          type="button"
          onClick={enablePlayback}
          className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-medium text-white"
        >
          Tap to play
        </button>
      )}
      {stream && !blockedByAutoplay && (
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Resume video" : "Pause video"}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
      )}
      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium backdrop-blur">
        {label}
      </span>
    </div>
  );
}

export default function VideoPanel({
  localStream,
  remoteStream,
  cameraError,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  cameraError: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <VideoTile stream={remoteStream} label="Stranger" />

      {cameraError ? (
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-surface p-2 text-center text-xs text-neutral-400">
          {cameraError}
        </div>
      ) : (
        <VideoTile stream={localStream} label="You" muted />
      )}
    </div>
  );
}
