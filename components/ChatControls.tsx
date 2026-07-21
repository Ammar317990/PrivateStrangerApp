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
        className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
      >
        Next stranger
      </button>
      <button
        onClick={onEnd}
        className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium transition hover:border-neutral-500"
      >
        End chat
      </button>
      <button
        onClick={handleReport}
        className="rounded-md border border-red-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-700"
      >
        Report
      </button>
    </div>
  );
}
