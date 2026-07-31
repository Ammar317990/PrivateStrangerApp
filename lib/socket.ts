import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "./api";
import type { MediaKind, MediaMode } from "./api";

export type MediaRef = { id: string; kind: MediaKind; mode: MediaMode; viewed?: boolean };
type OutgoingMedia = { id: string; kind: MediaKind; mode: MediaMode };

export type ServerToClientEvents = {
  waiting: () => void;
  matched: (data: { roomId: string; initiator: boolean; partner: { email: string } }) => void;
  "partner-left": (data: { reason: "skipped" | "disconnected" | "ended" | "reported" }) => void;
  "receive-message": (data: { text: string; media?: MediaRef; at: string }) => void;
  "webrtc-offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
  "report-ack": (data: { ok: true }) => void;
  error: (data: { message: string }) => void;
  "direct-chat-started": (data: {
    conversationId: string;
    partner: { email: string };
    messages: { text: string; media?: MediaRef; at: string; fromEmail: string }[];
  }) => void;
  "direct-chat-error": (data: { message: string }) => void;
  "direct-chat-unread-list": (data: {
    entries: { conversationId: string; otherEmail: string; count: number }[];
  }) => void;
  "direct-chat-unread": (data: { conversationId: string; fromEmail: string; count: number }) => void;
  "direct-message": (data: {
    conversationId: string;
    text: string;
    media?: MediaRef;
    at: string;
    fromEmail: string;
  }) => void;
  "live-chat-joined": (data: {
    messages: { text: string; media?: MediaRef; at: string; fromEmail: string }[];
  }) => void;
  "live-chat-message": (data: {
    text: string;
    media?: MediaRef;
    at: string;
    fromEmail: string;
  }) => void;
  "live-chat-online-count": (data: { count: number; users: string[] }) => void;
  "live-chat-typing": (data: { fromEmail: string }) => void;
  "live-chat-stop-typing": (data: { fromEmail: string }) => void;
  "direct-typing": (data: { conversationId: string; fromEmail: string }) => void;
  "direct-stop-typing": (data: { conversationId: string; fromEmail: string }) => void;
  "direct-messages-read": (data: { conversationId: string; readAt: string }) => void;
  "blocked-users-list": (data: { emails: string[] }) => void;
  typing: () => void;
  "stop-typing": () => void;
};

export type ClientToServerEvents = {
  "join-queue": () => void;
  skip: () => void;
  "end-chat": () => void;
  "send-message": (data: { text?: string; media?: OutgoingMedia }) => void;
  "webrtc-offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
  "report-user": (data: { reason?: string }) => void;
  "direct-chat-request": (data: { email: string }) => void;
  "direct-chat-open": (data: { conversationId: string }) => void;
  "direct-message": (data: {
    conversationId: string;
    text?: string;
    media?: OutgoingMedia;
  }) => void;
  "direct-chat-leave": (data: { conversationId: string }) => void;
  "live-chat-message": (data: { text?: string; media?: OutgoingMedia }) => void;
  "live-chat-typing": () => void;
  "live-chat-stop-typing": () => void;
  "direct-typing": (data: { conversationId: string }) => void;
  "direct-stop-typing": (data: { conversationId: string }) => void;
  typing: () => void;
  "stop-typing": () => void;
  "block-user": (data: { email: string }) => void;
  "unblock-user": (data: { email: string }) => void;
};

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): ChatSocket {
  return io(getBackendUrl(), {
    withCredentials: true,
    autoConnect: false,
  });
}
