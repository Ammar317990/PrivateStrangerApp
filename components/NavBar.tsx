"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleSignOut() {
    router.push("/");
    void signOut();
  }

  // The chat page is a full-bleed dashboard with its own sidebar (brand,
  // nav, account controls) — a second global nav bar on top of it would
  // just eat vertical space and duplicate the logo/logout it already has.
  // Login/register are their own full-screen moments too, with the brand
  // mark built into the card itself.
  if (pathname?.startsWith("/chat") || pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
          Stranger Chat
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
                  {user.email[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-neutral-300 transition hover:border-neutral-600 hover:text-foreground"
              >
                Log out
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
