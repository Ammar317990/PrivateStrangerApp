"use client";

import { useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function ZoomInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8.5" cy="8.5" r="6" />
      <path d="M8.5 6v5M6 8.5h5" strokeLinecap="round" />
      <path d="M13 13l4 4" strokeLinecap="round" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8.5" cy="8.5" r="6" />
      <path d="M6 8.5h5" strokeLinecap="round" />
      <path d="M13 13l4 4" strokeLinecap="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10a6 6 0 1 1 2 4.5" strokeLinecap="round" />
      <path d="M4 14v-3.5H7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampScale(s: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

export default function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function zoomBy(delta: number) {
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next === MIN_SCALE) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  function resetZoom() {
    setScale(MIN_SCALE);
    setPos({ x: 0, y: 0 });
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.3 : -0.3);
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinchStartDistRef.current = distance(pts[0], pts[1]);
      pinchStartScaleRef.current = scale;
    } else if (pointers.current.size === 1 && scale > 1) {
      setDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(pointers.current.values());
      const ratio = distance(pts[0], pts[1]) / pinchStartDistRef.current;
      setScale(clampScale(pinchStartScaleRef.current * ratio));
    } else if (dragging && dragStartRef.current) {
      setPos({
        x: dragStartRef.current.posX + (e.clientX - dragStartRef.current.x),
        y: dragStartRef.current.posY + (e.clientY - dragStartRef.current.y),
      });
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStartDistRef.current = null;
    if (pointers.current.size === 0) {
      setDragging(false);
      dragStartRef.current = null;
    }
  }

  function handleDoubleClick() {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-none items-center justify-end gap-1 p-3">
        <button
          type="button"
          onClick={() => zoomBy(-0.5)}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          disabled={scale === MIN_SCALE && pos.x === 0 && pos.y === 0}
          aria-label="Reset zoom"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ResetIcon />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.5)}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ZoomInIcon />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>

      <div
        className="flex flex-1 touch-none select-none items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className={`max-h-full max-w-full ${dragging ? "" : "transition-transform duration-150"} ${
            scale > 1 ? "cursor-grab" : "cursor-zoom-in"
          }`}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
        />
      </div>
    </div>
  );
}
