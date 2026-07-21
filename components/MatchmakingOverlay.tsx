"use client";

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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-neutral-800 p-8 text-center">
      {status === "waiting" ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
          <p className="text-neutral-300">Looking for a stranger…</p>
        </>
      ) : (
        <>
          <p className="text-neutral-300">
            {statusMessage || "Ready to meet someone new?"}
          </p>
          <button
            onClick={onStart}
            disabled={disabled}
            className="rounded-full bg-white px-6 py-3 font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            Start chatting
          </button>
        </>
      )}
    </div>
  );
}
