"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Stranger Chat",
  description: "Talk to random people over text and video — live, no sign-up hassle.",
  url: "https://private-stranger-app.vercel.app",
  applicationCategory: "SocialNetworkingApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl"
      />

      <span className="relative rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-neutral-400">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
        Live video &amp; text, no sign-up hassle
      </span>

      <h1 className="relative max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Meet someone new,{" "}
        <span className="bg-gradient-to-r from-accent to-fuchsia-400 bg-clip-text text-transparent">
          right now
        </span>
      </h1>

      <p className="relative max-w-md text-neutral-400">
        Get randomly paired with someone new for a live text and video conversation.
      </p>

      {loading ? null : user ? (
        <Link
          href="/chat"
          className="relative rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          Start chatting
        </Link>
      ) : (
        <div className="relative flex gap-3">
          <Link
            href="/register"
            className="rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground transition hover:bg-accent-hover"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border-subtle bg-surface px-6 py-3 font-medium transition hover:border-neutral-600"
          >
            Log in
          </Link>
        </div>
      )}
    </main>
  );
}
