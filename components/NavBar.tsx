"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
      <Link href="/" className="font-semibold">
        Stranger Chat
      </Link>
      {user && (
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{user.email}</span>
          <button onClick={handleSignOut} className="text-white underline">
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
