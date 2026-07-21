// Resolved lazily (never at module load) so it can fall back to whatever
// host the page was actually loaded from — this makes the app work both on
// localhost and when a friend opens it via your LAN IP, without needing to
// hardcode an address. Set NEXT_PUBLIC_BACKEND_URL to override (e.g. for a
// real deployment where the backend lives on a different host).
function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== "undefined") {
    // Match the page's own protocol: the backend runs HTTPS alongside an
    // HTTPS frontend (see scripts/generate-dev-cert.sh), and browsers block
    // an HTTPS page from making plain-HTTP requests ("mixed content").
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

export type User = { id: string; email: string };

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status);
  }

  return data as T;
}

export function register(email: string, password: string) {
  return request<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function me() {
  return request<{ user: User }>("/api/auth/me");
}

export function logout() {
  return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export { ApiError, getBackendUrl };
