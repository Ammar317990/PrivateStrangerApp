"use client";

function CameraOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="5.5" width="10" height="9" rx="2" />
      <path d="M12.5 9l5-3v8l-5-3" />
      <path d="M3 3l14 14" strokeLinecap="round" />
    </svg>
  );
}

export default function MatchmakingOverlay({
  status,
  statusMessage,
  disabled,
  onStart,
}: {
  status: "idle" | "waiting";
  statusMessage: string | null;
  disabled?: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 rounded-xl border border-border-subtle bg-surface/40 p-8 text-center">
      {status === "waiting" ? (
        <>
          <div className="h-[26px] w-[26px] animate-spin rounded-full border-[2.5px] border-border-subtle border-t-accent" />
          <h3 className="text-[15.5px] font-semibold">Looking for a stranger…</h3>
          <p className="max-w-[30ch] text-xs leading-relaxed text-neutral-400">
            Camera and mic just turned on for this tab only.
          </p>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-surface text-neutral-400">
            <CameraOffIcon />
          </div>
          <h3 className="text-[15.5px] font-semibold">Camera &amp; mic are off</h3>
          <p className="max-w-[30ch] text-xs leading-relaxed text-neutral-400">
            {statusMessage || "They turn on only if you tap below — nothing starts just from opening this tab."}
          </p>
          <button
            onClick={onStart}
            disabled={disabled}
            className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
          >
            Find a stranger
          </button>
          <span className="text-[11px] text-neutral-500">Text-only chat still works without them</span>
        </>
      )}
    </div>
  );
}
