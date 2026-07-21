"use client";

import { useEffect, useRef } from "react";

export default function VideoPanel({
  localStream,
  remoteStream,
  cameraError,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  cameraError: string | null;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-900">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">
          Stranger
        </span>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-900">
        {cameraError ? (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-neutral-400">
            {cameraError}
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">
          You
        </span>
      </div>
    </div>
  );
}
