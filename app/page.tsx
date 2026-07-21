"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Stranger Chat</h1>
      <p className="max-w-md text-neutral-400">
        Get randomly paired with someone new for a live text and video conversation.
      </p>

      {loading ? null : user ? (
        <Link
          href="/chat"
          className="rounded-full bg-white px-6 py-3 font-medium text-neutral-900 transition hover:bg-neutral-200"
        >
          Start chatting
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/register"
            className="rounded-full bg-white px-6 py-3 font-medium text-neutral-900 transition hover:bg-neutral-200"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-neutral-700 px-6 py-3 font-medium transition hover:border-neutral-500"
          >
            Log in
          </Link>
        </div>
      )}
    </main>
  );
}
