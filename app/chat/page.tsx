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
type Section = "live" | "video";

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
      {typeof badge === "number" && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active ? "bg-black/20" : "bg-surface-hover text-neutral-400"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function OnlineUsersRow({
  emails,
  onPick,
}: {
  emails: string[];
  onPick: (email: string) => void;
}) {
  if (emails.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border-subtle bg-surface/40 p-2">
      <span className="flex-none px-1 text-xs font-medium text-neutral-500">Chat 1:1 with</span>
      {emails.map((email) => (
        <button
          key={email}
          type="button"
          onClick={() => onPick(email)}
          title={`Start a private chat with ${email}`}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold text-white transition hover:scale-105"
          style={{ backgroundColor: colorFor(email) }}
        >
          {email[0]?.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

type IncomingInvite = { requestId: string; fromEmail: string };

function IncomingInviteBanner({
  invite,
  extraCount,
  onAccept,
  onDecline,
}: {
  invite: IncomingInvite;
  extraCount: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: colorFor(invite.fromEmail) }}
      >
        {invite.fromEmail[0]?.toUpperCase()}
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">{invite.fromEmail}</span> wants to chat with you
        {extraCount > 0 && (
          <span className="text-neutral-400"> · +{extraCount} more waiting</span>
        )}
      </p>
      <div className="flex flex-none gap-2">
        <button
          onClick={onDecline}
          className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-neutral-600"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

function OnlineNowSidebar({
  emails,
  onPick,
}: {
  emails: string[];
  onPick: (email: string) => void;
}) {
  if (emails.length === 0) return null;
  return (
    <div className="mt-auto flex flex-col gap-1.5">
      <div className="px-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Online now
      </div>
      <div className="scrollbar-thin flex max-h-52 flex-col gap-0.5 overflow-y-auto">
        {emails.map((email) => (
          <button
            key={email}
            type="button"
            onClick={() => onPick(email)}
            title={`Start a private chat with ${email}`}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs text-neutral-400 transition hover:bg-surface hover:text-white"
          >
            <span
              className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: colorFor(email) }}
            >
              {email[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{email}</span>
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [section, setSection] = useState<Section>("live");

  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [liveOnlineCount, setLiveOnlineCount] = useState(0);
  const [liveOnlineUsers, setLiveOnlineUsers] = useState<string[]>([]);

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
  const [waitingForEmail, setWaitingForEmail] = useState<string | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  const [iceServersReady, setIceServersReady] = useState(false);

  const socketRef = useRef<ChatSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const iceServersRef = useRef<RTCIceServer[] | undefined>(undefined);
  const directConversationIdRef = useRef<string | null>(null);
  const statusRef = useRef<Status>("idle");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!user) return;
    getTurnCredentials()
      .then(({ iceServers }) => {
        iceServersRef.current = iceServers;
      })
      .catch(() => {
        // Leave iceServersRef unset — createPeerConnection falls back to STUN-only.
      })
      .finally(() => {
        setIceServersReady(true);
      });
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
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

    console.log("[webrtc] creating peer connection", {
      iceServers: iceServersRef.current,
      hasLocalStream: !!localStreamRef.current,
      localTracks: localStreamRef.current?.getTracks().map((t) => t.kind),
    });

    const pc = createPeerConnection(iceServersRef.current);
    pcRef.current = pc;

    if (localStreamRef.current) {
      attachLocalTracks(pc, localStreamRef.current);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[webrtc] local ice candidate", event.candidate.type, event.candidate.protocol);
        socket.emit("webrtc-ice-candidate", { candidate: event.candidate.toJSON() });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] iceConnectionState:", pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log("[webrtc] iceGatheringState:", pc.iceGatheringState);
    };

    pc.ontrack = (event) => {
      console.log("[webrtc] ontrack fired", event.track.kind);
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
      console.log("[webrtc] received offer, pc exists:", !!pcRef.current);
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      console.log("[webrtc] flushed pending candidates:", pendingCandidatesRef.current.length);
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (pc.localDescription) {
        socket.emit("webrtc-answer", { sdp: pc.localDescription });
      }
    });

    socket.on("webrtc-answer", async ({ sdp }) => {
      console.log("[webrtc] received answer, pc exists:", !!pcRef.current);
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      console.log("[webrtc] flushed pending candidates:", pendingCandidatesRef.current.length);
      pendingCandidatesRef.current = [];
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      const typeMatch = /typ (\w+)/.exec(candidate?.candidate || "");
      console.log("[webrtc] received remote ice candidate", typeMatch?.[1], "pc exists:", !!pc, "remoteDescription set:", !!pc?.remoteDescription);
      if (!pc) return;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(candidate).catch((err) => console.error("[webrtc] addIceCandidate failed:", err));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    socket.on("direct-chat-started", ({ conversationId, partner, messages }) => {
      if (statusRef.current !== "idle") {
        // Busy in (or waiting for) a random chat — don't interrupt it, silently
        // decline the incoming direct chat by leaving its room right away.
        socket.emit("direct-chat-leave", { conversationId });
        return;
      }
      directConversationIdRef.current = conversationId;
      setDirectConnecting(false);
      setWaitingForEmail(null);
      setDirectError(null);
      setDirectConversationId(conversationId);
      setDirectPartnerEmail(partner.email);
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
      setDirectConnecting(false);
      setWaitingForEmail(null);
      setDirectError(message);
    });

    socket.on("direct-chat-invite", ({ requestId, fromEmail }) => {
      setIncomingInvites((prev) =>
        prev.some((i) => i.requestId === requestId) ? prev : [...prev, { requestId, fromEmail }]
      );
    });

    socket.on("direct-chat-invite-sent", ({ targetEmail }) => {
      setDirectConnecting(false);
      setWaitingForEmail(targetEmail);
    });

    socket.on("direct-chat-invite-expired", ({ requestId }) => {
      setIncomingInvites((prev) => prev.filter((i) => i.requestId !== requestId));
    });

    socket.on("direct-chat-declined", ({ targetEmail }) => {
      setWaitingForEmail(null);
      setDirectError(`${targetEmail} declined the chat.`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupPeerConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleStart() {
    await ensureCamera();
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
    setDirectConnecting(true);
    setDirectError(null);
    socketRef.current?.emit("direct-chat-request", { email });
  }

  function handleAcceptInvite(requestId: string) {
    socketRef.current?.emit("direct-chat-respond", { requestId, accept: true });
    setIncomingInvites((prev) => prev.filter((i) => i.requestId !== requestId));
  }

  function handleDeclineInvite(requestId: string) {
    socketRef.current?.emit("direct-chat-respond", { requestId, accept: false });
    setIncomingInvites((prev) => prev.filter((i) => i.requestId !== requestId));
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

  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center text-neutral-400">
        Loading…
      </main>
    );
  }

  const inDirectChat = directConversationId !== null;
  const inRandomChat = status === "matched";

  const videoStatusPill =
    status === "waiting" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-neutral-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Waiting
      </span>
    ) : inRandomChat || inDirectChat ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Connected
      </span>
    ) : null;

  const liveStatusPill = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {liveOnlineCount} online
    </span>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 p-4">
      <div className="flex w-full flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)]">
        <aside className="hidden w-52 flex-none flex-col gap-1 border-r border-border-subtle bg-surface/30 p-4 lg:flex">
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
          <OnlineNowSidebar
            emails={liveOnlineUsers.filter((email) => email !== user.email)}
            onPick={handleRequestDirectChat}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {inDirectChat
                ? `Chatting with ${directPartnerEmail}`
                : section === "live"
                  ? "Live Chat"
                  : inRandomChat
                    ? `Chatting with ${partnerEmail ?? "Stranger"}`
                    : "Video Chat"}
            </h1>
            {inDirectChat || section === "video" ? videoStatusPill : liveStatusPill}
          </div>
          <div className="flex gap-2 lg:hidden">
            <TabButton active={section === "live"} onClick={() => setSection("live")}>
              Live Chat
            </TabButton>
            <TabButton active={section === "video"} onClick={() => setSection("video")}>
              Video Chat
            </TabButton>
          </div>
        </div>

        {incomingInvites[0] && (
          <IncomingInviteBanner
            invite={incomingInvites[0]}
            extraCount={incomingInvites.length - 1}
            onAccept={() => handleAcceptInvite(incomingInvites[0].requestId)}
            onDecline={() => handleDeclineInvite(incomingInvites[0].requestId)}
          />
        )}

        {inDirectChat ? (
          <>
            <ChatPanel messages={directMessages} onSend={handleSendDirect} disabled={false} />
            <button
              onClick={handleCloseDirect}
              className="rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-medium transition hover:border-neutral-600"
            >
              Close chat
            </button>
          </>
        ) : section === "live" ? (
          <>
            <div className="lg:hidden">
              <OnlineUsersRow
                emails={liveOnlineUsers.filter((email) => email !== user.email)}
                onPick={handleRequestDirectChat}
              />
            </div>
            {directConnecting && <p className="px-1 text-xs text-neutral-500">Sending request…</p>}
            {waitingForEmail && (
              <p className="px-1 text-xs text-neutral-500">Waiting for {waitingForEmail} to accept…</p>
            )}
            {directError && <p className="px-1 text-xs text-red-400">{directError}</p>}
            <ChatPanel
              messages={liveMessages}
              onSend={handleSendLive}
              disabled={false}
              placeholder="Message the room…"
            />
          </>
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
              statusMessage={iceServersReady ? statusMessage : "Preparing connection…"}
              disabled={directConnecting || !iceServersReady}
              onStart={handleStart}
            />
            <DirectChatStarter
              disabled={status === "waiting"}
              connecting={directConnecting || waitingForEmail !== null}
              error={directError}
              onStart={handleRequestDirectChat}
            />
          </>
        )}
        </main>
      </div>
    </div>
  );
}
