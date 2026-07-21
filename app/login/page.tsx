"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const something = "test";
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await api.login(email, password);
      setUser(user);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-800 p-6"
      >
        <h1 className="text-xl font-semibold">Log in</h1>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <p className="text-center text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-white underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
