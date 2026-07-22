const BUBBLES: { text: string; from: "me" | "them"; top: string; left: string; delay: string }[] = [
  { text: "hey, anyone up? 👋", from: "them", top: "10%", left: "6%", delay: "0s" },
  { text: "haha yes! what's up", from: "me", top: "16%", left: "70%", delay: "1.4s" },
  { text: "just here to vibe", from: "them", top: "70%", left: "8%", delay: "2.3s" },
  { text: "same 😄 where you from?", from: "me", top: "80%", left: "58%", delay: "0.7s" },
  { text: "sent a photo 📷", from: "them", top: "42%", left: "84%", delay: "1.9s" },
  { text: "nice view!", from: "me", top: "52%", left: "2%", delay: "3.1s" },
];

export default function ChatBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden blur-[2px]">
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className={`animate-drift absolute whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-medium opacity-[0.16] ${
            b.from === "me"
              ? "rounded-br-sm bg-accent text-white"
              : "rounded-bl-sm bg-surface-hover text-neutral-100"
          }`}
          style={{ top: b.top, left: b.left, animationDelay: b.delay }}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}
