"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getTurnCredentials } from "@/lib/api";
import { createSocket, type ChatSocket } from "@/lib/socket";
import { createPeerConnection, attachLocalTracks } from "@/lib/webrtc";
import VideoPanel from "@/components/VideoPanel";
import ChatPanel, { colorFor, type ChatMessage, type ChatSendInput } from "@/components/ChatPanel";
import MatchmakingOverlay from "@/components/MatchmakingOverlay";
import ChatControls from "@/components/ChatControls";
import DirectChatStarter from "@/components/DirectChatStarter";

type Status = "idle" | "waiting" | "matched";
type Section = "live" | "video" | "personal";
type UnreadEntry = { conversationId: string; otherEmail: string; count: number };

const REASON_MESSAGES: Record<string, string> = {
  skipped: "Stranger left to talk to someone else.",
  disconnected: "Stranger disconnected.",
  ended: "Chat ended.",
  reported: "You reported this stranger and the chat ended.",
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-accent text-accent-foreground"
          : "border border-border-subtle bg-surface text-neutral-400 hover:border-neutral-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function LiveChatIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 8.5L10 3l7 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 8v7a1 1 0 001 1h9a1 1 0 001-1V8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoChatIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="5.5" width="10" height="9" rx="2" />
      <path d="M12.5 9l5-3v8l-5-3" strokeLinejoin="round" />
    </svg>
  );
}

function PersonalChatsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="3" />
      <path d="M2.5 16.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" strokeLinecap="round" />
      <circle cx="14.5" cy="6.5" r="2.2" />
      <path d="M12.7 10.3c1.9.2 3.3 1.6 3.3 4.2" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 4H4.5a1 1 0 00-1 1v10a1 1 0 001 1H8" strokeLinecap="round" />
      <path d="M13 13.5L16.5 10 13 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 10H7.5" strokeLinecap="round" />
    </svg>
  );
}

function BrandRow() {
  return (
    <div className="flex items-center gap-2 px-1.5 pb-2 font-semibold tracking-tight">
      <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
      Stranger Chat
    </div>
  );
}

function UserRow({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border-subtle pt-3">
      <span
        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: colorFor(email) }}
      >
        {email[0]?.toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-neutral-400">{email}</span>
      <button
        onClick={onSignOut}
        title="Log out"
        aria-label="Log out"
        className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-neutral-500 transition hover:bg-surface hover:text-white"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}

function SidebarNavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-accent text-accent-foreground" : "text-neutral-400 hover:bg-surface hover:text-white"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active ? "bg-black/20" : "bg-accent/20 text-accent"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function PersonalChatsView({
  onlineEmails,
  unreadEntries,
  onStartChat,
  onOpenChat,
}: {
  onlineEmails: string[];
  unreadEntries: UnreadEntry[];
  onStartChat: (email: string) => void;
  onOpenChat: (conversationId: string) => void;
}) {
  const unreadEmails = new Set(unreadEntries.map((e) => e.otherEmail));
  const availableOnline = onlineEmails.filter((email) => !unreadEmails.has(email));

  if (unreadEntries.length === 0 && availableOnline.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-border-subtle bg-surface/40 p-8 text-center">
        <p className="text-sm text-neutral-400">Nobody else is online right now.</p>
        <p className="text-xs text-neutral-500">Check back later, or say hi in Live Chat.</p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto rounded-xl border border-border-subtle bg-surface/40 p-3">
      {unreadEntries.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Messaged you
          </p>
          {unreadEntries.map((entry) => (
            <button
              key={entry.conversationId}
              onClick={() => onOpenChat(entry.conversationId)}
              className="flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-surface"
            >
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: colorFor(entry.otherEmail) }}
              >
                {entry.otherEmail[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{entry.otherEmail}</span>
              <span className="flex h-5 min-w-[20px] flex-none items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                {entry.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {availableOnline.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Online now
          </p>
          {availableOnline.map((email) => (
            <button
              key={email}
              onClick={() => onStartChat(email)}
              className="flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-surface"
            >
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: colorFor(email) }}
              >
                {email[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">{email}</span>
              <span className="h-2 w-2 flex-none rounded-full bg-emerald-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [section, setSection] = useState<Section>("live");

  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [liveOnlineCount, setLiveOnlineCount] = useState(0);
  const [liveOnlineUsers, setLiveOnlineUsers] = useState<string[]>([]);
  const [unreadEntries, setUnreadEntries] = useState<UnreadEntry[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [directConversationId, setDirectConversationId] = useState<string | null>(null);
  const [directPartnerEmail, setDirectPartnerEmail] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);
  const [directConnecting, setDirectConnecting] = useState(false);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<ChatSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const iceServersRef = useRef<RTCIceServer[] | undefined>(undefined);
  const directConversationIdRef = useRef<string | null>(null);
  const directConnectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<Status>("idle");
  const signingOutRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    // Skip when we're already navigating away because of an explicit sign-out
    // (handleSignOut) — otherwise this races that navigation and can win,
    // landing on /login instead of the intended destination.
    if (!loading && !user && !signingOutRef.current) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Camera/mic are requested on demand (see ensureCamera, called from
  // handleStart) rather than the moment the page loads — Live Chat needs
  // neither, and Video Chat shouldn't prompt for them before someone
  // actually opts in. Just make sure whatever got acquired is released
  // when the page unmounts.
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (directConnectingTimeoutRef.current) clearTimeout(directConnectingTimeoutRef.current);
    };
  }, []);

  async function ensureCamera() {
    if (localStreamRef.current) return;

    // navigator.mediaDevices only exists in secure contexts (HTTPS, or
    // http://localhost) — e.g. it's undefined when someone opens the app
    // over plain http:// at a LAN IP. Fail gracefully instead of throwing.
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera/mic requires a secure connection (HTTPS or localhost) — you can still use text chat."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraError(null);
    } catch {
      setCameraError("Camera/mic unavailable — you can still use text chat.");
    }
  }

  // Fetched on demand (first "Find a stranger" click) instead of on every
  // /chat page load — most visits are Live Chat/Personal Chats and never
  // touch Video Chat, so there's no reason to hit the TURN provider's API
  // every single time.
  async function ensureIceServers() {
    if (iceServersRef.current !== undefined) return;
    try {
      const { iceServers } = await getTurnCredentials();
      iceServersRef.current = iceServers;
    } catch {
      // Leave iceServersRef unset — createPeerConnection falls back to STUN-only.
    }
  }

  // Guards against ever getting stuck on "Opening chat…"/"Sending
  // request…" — if the server doesn't answer (dropped event, deploy lag,
  // an edge case we didn't anticipate) within a few seconds, this clears
  // the loading state and surfaces an error instead of hanging forever.
  function startDirectConnecting() {
    setDirectConnecting(true);
    setDirectError(null);
    if (directConnectingTimeoutRef.current) clearTimeout(directConnectingTimeoutRef.current);
    directConnectingTimeoutRef.current = setTimeout(() => {
      setDirectConnecting(false);
      setDirectError("That took too long — try again.");
    }, 8000);
  }

  function stopDirectConnecting() {
    if (directConnectingTimeoutRef.current) {
      clearTimeout(directConnectingTimeoutRef.current);
      directConnectingTimeoutRef.current = null;
    }
    setDirectConnecting(false);
  }

  const cleanupPeerConnection = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
    }
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
  }, []);

  const setupPeerConnection = useCallback((socket: ChatSocket, initiator: boolean) => {
    cleanupPeerConnection();

    const pc = createPeerConnection(iceServersRef.current);
    pcRef.current = pc;

    if (localStreamRef.current) {
      attachLocalTracks(pc, localStreamRef.current);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", { candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription) {
            socket.emit("webrtc-offer", { sdp: pc.localDescription });
          }
        })
        .catch((err) => console.error("Failed to create offer:", err));
    }
  }, [cleanupPeerConnection]);

  // Socket lifecycle + event wiring, once authenticated.
  useEffect(() => {
    if (!user) return;

    const socket = createSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("connect_error", () => {
      router.replace("/login");
    });

    socket.on("live-chat-joined", ({ messages }) => {
      setLiveMessages(
        messages.map((m) => ({
          text: m.text,
          at: m.at,
          fromSelf: m.fromEmail === user.email,
          fromEmail: m.fromEmail,
          media: m.media,
          gifUrl: m.gifUrl,
        }))
      );
    });

    socket.on("live-chat-message", ({ text, at, fromEmail, media, gifUrl }) => {
      setLiveMessages((prev) => [
        ...prev,
        { text, at, fromSelf: fromEmail === user.email, fromEmail, media, gifUrl },
      ]);
    });

    socket.on("live-chat-online-count", ({ count, users }) => {
      setLiveOnlineCount(count);
      setLiveOnlineUsers(users);
    });

    socket.on("waiting", () => {
      setStatus("waiting");
      setStatusMessage(null);
    });

    socket.on("matched", ({ initiator, partner }) => {
      setStatus("matched");
      setPartnerEmail(partner.email);
      setMessages([]);
      setStatusMessage(null);
      setupPeerConnection(socket, initiator);
    });

    socket.on("partner-left", ({ reason }) => {
      cleanupPeerConnection();
      setStatus("idle");
      setPartnerEmail(null);
      setStatusMessage(REASON_MESSAGES[reason] || "Chat ended.");
    });

    socket.on("receive-message", ({ text, media, gifUrl, at }) => {
      setMessages((prev) => [...prev, { text, media, gifUrl, at, fromSelf: false }]);
    });

    socket.on("webrtc-offer", async ({ sdp }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (pc.localDescription) {
        socket.emit("webrtc-answer", { sdp: pc.localDescription });
      }
    });

    socket.on("webrtc-answer", async ({ sdp }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(candidate).catch((err) => console.error("[webrtc] addIceCandidate failed:", err));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    socket.on("direct-chat-started", ({ conversationId, partner, messages }) => {
      if (statusRef.current !== "idle") {
        // Busy in (or waiting for) a random chat — don't interrupt it, decline
        // the incoming direct chat by leaving its room right away. Must still
        // clear the loading state, or "Opening chat…"/"Sending request…"
        // sticks forever with nothing left to clear it.
        socket.emit("direct-chat-leave", { conversationId });
        stopDirectConnecting();
        setDirectError("You're in a video chat — end it first to open a direct chat.");
        return;
      }
      directConversationIdRef.current = conversationId;
      stopDirectConnecting();
      setDirectError(null);
      setDirectConversationId(conversationId);
      setDirectPartnerEmail(partner.email);
      setUnreadEntries((prev) => prev.filter((e) => e.otherEmail !== partner.email));
      setDirectMessages(
        messages.map((m) => ({
          text: m.text,
          at: m.at,
          fromSelf: m.fromEmail === user.email,
          media: m.media,
          gifUrl: m.gifUrl,
        }))
      );
    });

    socket.on("direct-message", ({ conversationId, text, at, media, gifUrl }) => {
      if (directConversationIdRef.current !== conversationId) return;
      setDirectMessages((prev) => [...prev, { text, media, gifUrl, at, fromSelf: false }]);
    });

    socket.on("direct-chat-error", ({ message }) => {
      stopDirectConnecting();
      setDirectError(message);
    });

    socket.on("direct-chat-unread-list", ({ entries }) => {
      setUnreadEntries(entries);
    });

    socket.on("direct-chat-unread", ({ conversationId, fromEmail, count }) => {
      setUnreadEntries((prev) => {
        const next = prev.filter((e) => e.conversationId !== conversationId);
        next.push({ conversationId, otherEmail: fromEmail, count });
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupPeerConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleStart() {
    await Promise.all([ensureCamera(), ensureIceServers()]);
    socketRef.current?.emit("join-queue");
    setStatus("waiting");
  }

  function handleSkip() {
    socketRef.current?.emit("skip");
    cleanupPeerConnection();
    setStatus("waiting");
    setPartnerEmail(null);
    setMessages([]);
  }

  function handleEnd() {
    socketRef.current?.emit("end-chat");
    cleanupPeerConnection();
    setStatus("idle");
    setPartnerEmail(null);
    setStatusMessage(null);
    setMessages([]);
  }

  function handleReport() {
    socketRef.current?.emit("report-user", {});
  }

  function handleSignOut() {
    // Navigate first so the page is already leaving before `user` flips to
    // null — otherwise this component's own "not signed in" fallback flashes
    // for a frame while still mounted, which reads as a broken blank screen.
    signingOutRef.current = true;
    router.push("/");
    void signOut();
  }

  function handleSend({ text, media, gifUrl }: ChatSendInput) {
    socketRef.current?.emit("send-message", { text, media, gifUrl });
    setMessages((prev) => [
      ...prev,
      { text: text || "", media, gifUrl, at: new Date().toISOString(), fromSelf: true },
    ]);
  }

  function handleSendLive({ text, media, gifUrl }: ChatSendInput) {
    // No optimistic append: the server broadcasts back to every socket in
    // the lobby, sender included, so appending locally would double it up.
    socketRef.current?.emit("live-chat-message", { text, media, gifUrl });
  }

  function handleRequestDirectChat(email: string) {
    startDirectConnecting();
    socketRef.current?.emit("direct-chat-request", { email });
  }

  function handleOpenConversation(conversationId: string) {
    startDirectConnecting();
    socketRef.current?.emit("direct-chat-open", { conversationId });
  }

  function handleCloseDirect() {
    if (directConversationId) {
      socketRef.current?.emit("direct-chat-leave", { conversationId: directConversationId });
    }
    directConversationIdRef.current = null;
    setDirectConversationId(null);
    setDirectPartnerEmail(null);
    setDirectMessages([]);
    setDirectError(null);
  }

  function handleSendDirect({ text, media, gifUrl }: ChatSendInput) {
    if (!directConversationId) return;
    socketRef.current?.emit("direct-message", { conversationId: directConversationId, text, media, gifUrl });
    setDirectMessages((prev) => [
      ...prev,
      { text: text || "", media, gifUrl, at: new Date().toISOString(), fromSelf: true },
    ]);
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center text-neutral-400">
        Loading…
      </main>
    );
  }

  // We know for sure there's no user (just signed out, or session expired) —
  // the effect above is already navigating away, so render nothing rather
  // than flashing a "Loading…" state for a page we're about to leave.
  if (!user) {
    return null;
  }

  const inDirectChat = directConversationId !== null;
  const inRandomChat = status === "matched";
  const totalUnread = unreadEntries.reduce((sum, e) => sum + e.count, 0);

  const connectedPill = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Connected
    </span>
  );

  const videoStatusPill =
    status === "waiting" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-neutral-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Waiting
      </span>
    ) : inRandomChat ? (
      connectedPill
    ) : null;

  const liveStatusPill = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {liveOnlineCount} online
    </span>
  );

  const headerPill =
    section === "video" ? videoStatusPill
    : section === "live" ? liveStatusPill
    : section === "personal" && inDirectChat ? connectedPill
    : null;

  return (
    <div className="flex h-full w-full flex-1">
      <aside className="hidden w-56 flex-none flex-col gap-1 border-r border-border-subtle bg-surface/30 p-4 lg:flex">
        <BrandRow />
        <SidebarNavButton
          active={section === "live"}
          onClick={() => setSection("live")}
          icon={<LiveChatIcon />}
          label="Live Chat"
          badge={liveOnlineCount}
        />
        <SidebarNavButton
          active={section === "video"}
          onClick={() => setSection("video")}
          icon={<VideoChatIcon />}
          label="Video Chat"
        />
        <SidebarNavButton
          active={section === "personal"}
          onClick={() => setSection("personal")}
          icon={<PersonalChatsIcon />}
          label="Personal Chats"
          badge={totalUnread}
        />
        <UserRow email={user.email} onSignOut={handleSignOut} />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {section === "live"
                ? "Live Chat"
                : section === "personal"
                  ? inDirectChat
                    ? `Chatting with ${directPartnerEmail}`
                    : "Personal Chats"
                  : inRandomChat
                    ? `Chatting with ${partnerEmail ?? "Stranger"}`
                    : "Video Chat"}
            </h1>
            <div className="flex items-center gap-2">
              {headerPill}
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-600 hover:text-white lg:hidden"
              >
                Log out
              </button>
            </div>
          </div>
          <div className="flex gap-2 lg:hidden">
            <TabButton active={section === "live"} onClick={() => setSection("live")}>
              Live Chat
            </TabButton>
            <TabButton active={section === "video"} onClick={() => setSection("video")}>
              Video Chat
            </TabButton>
            <TabButton active={section === "personal"} onClick={() => setSection("personal")}>
              Personal{totalUnread > 0 ? ` (${totalUnread})` : ""}
            </TabButton>
          </div>
        </div>

        {section === "live" ? (
          <ChatPanel
            messages={liveMessages}
            onSend={handleSendLive}
            disabled={false}
            placeholder="Message the room…"
          />
        ) : section === "personal" ? (
          inDirectChat ? (
            <>
              <ChatPanel messages={directMessages} onSend={handleSendDirect} disabled={false} />
              <button
                onClick={handleCloseDirect}
                className="rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-medium transition hover:border-neutral-600"
              >
                Close chat
              </button>
            </>
          ) : (
            <>
              {directConnecting && <p className="px-1 text-xs text-neutral-500">Opening chat…</p>}
              {directError && <p className="px-1 text-xs text-red-400">{directError}</p>}
              <PersonalChatsView
                onlineEmails={liveOnlineUsers.filter((email) => email !== user.email)}
                unreadEntries={unreadEntries}
                onStartChat={handleRequestDirectChat}
                onOpenChat={handleOpenConversation}
              />
            </>
          )
        ) : inRandomChat ? (
          <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              <VideoPanel localStream={localStream} remoteStream={remoteStream} cameraError={cameraError} />
              <ChatControls onSkip={handleSkip} onEnd={handleEnd} onReport={handleReport} />
            </div>
            <ChatPanel messages={messages} onSend={handleSend} disabled={false} />
          </div>
        ) : (
          <>
            {status !== "idle" && (
              <VideoPanel localStream={localStream} remoteStream={remoteStream} cameraError={cameraError} />
            )}
            <MatchmakingOverlay
              status={status === "waiting" ? "waiting" : "idle"}
              statusMessage={statusMessage}
              onStart={handleStart}
            />
            <DirectChatStarter
              disabled={status === "waiting"}
              connecting={directConnecting}
              error={directError}
              onStart={handleRequestDirectChat}
            />
          </>
        )}
      </main>
    </div>
  );
}
