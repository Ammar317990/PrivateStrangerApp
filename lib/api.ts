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

export function getTurnCredentials() {
  return request<{ iceServers: RTCIceServer[] }>("/api/turn/credentials");
}

export type MediaKind = "photo" | "video" | "audio";
export type MediaMode = "keep" | "once";

// Not routed through request() — a multipart body needs the browser to set
// its own Content-Type (with the multipart boundary), which request()'s
// hardcoded "application/json" header would clobber.
export async function uploadMedia(file: File, mode: MediaMode) {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);

  const res = await fetch(`${getBackendUrl()}/api/media`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || "Upload failed", res.status);
  }
  return data as { id: string; kind: MediaKind; mode: MediaMode };
}

export function getMediaUrl(id: string): string {
  return `${getBackendUrl()}/api/media/${id}`;
}

export type GifResult = { id: string; url: string; previewUrl: string; width: number; height: number };

export function searchGifs(query: string) {
  const q = query.trim();
  return request<{ results: GifResult[] }>(`/api/gifs${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}

export { ApiError, getBackendUrl };
