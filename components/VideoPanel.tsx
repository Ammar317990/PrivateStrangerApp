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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    // A new stream (reconnect, new match, etc.) should always start live.
    setPaused(false);
  }, [stream]);

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
    <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover transition-[filter] duration-300 ${
          paused ? "blur-lg" : ""
        }`}
      />
      {stream && (
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Resume video" : "Pause video"}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">
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
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-900 p-2 text-center text-xs text-neutral-400">
          {cameraError}
        </div>
      ) : (
        <VideoTile stream={localStream} label="You" muted />
      )}
    </div>
  );
}
