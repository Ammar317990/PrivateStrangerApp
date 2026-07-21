"use client";

export default function ChatControls({
  onSkip,
  onEnd,
  onReport,
}: {
  onSkip: () => void;
  onEnd: () => void;
  onReport: () => void;
}) {
  function handleReport() {
    if (window.confirm("Report this stranger for inappropriate behavior and end the chat?")) {
      onReport();
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onSkip}
        className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
      >
        Next stranger
      </button>
      <button
        onClick={onEnd}
        className="flex-1 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-neutral-600"
      >
        End chat
      </button>
      <button
        onClick={handleReport}
        className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-700"
      >
        Report
      </button>
    </div>
  );
}
