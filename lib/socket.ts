import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "./api";

export type ServerToClientEvents = {
  waiting: () => void;
  matched: (data: { roomId: string; initiator: boolean; partner: { email: string } }) => void;
  "partner-left": (data: { reason: "skipped" | "disconnected" | "ended" | "reported" }) => void;
  "receive-message": (data: { text: string; at: string }) => void;
  "webrtc-offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
  "report-ack": (data: { ok: true }) => void;
  error: (data: { message: string }) => void;
  "direct-chat-started": (data: {
    conversationId: string;
    partner: { email: string };
    messages: { text: string; at: string; fromEmail: string }[];
  }) => void;
  "direct-chat-error": (data: { message: string }) => void;
  "direct-message": (data: {
    conversationId: string;
    text: string;
    at: string;
    fromEmail: string;
  }) => void;
  "live-chat-joined": (data: {
    messages: { text: string; at: string; fromEmail: string }[];
  }) => void;
  "live-chat-message": (data: { text: string; at: string; fromEmail: string }) => void;
  "live-chat-online-count": (data: { count: number }) => void;
};

export type ClientToServerEvents = {
  "join-queue": () => void;
  skip: () => void;
  "end-chat": () => void;
  "send-message": (data: { text: string }) => void;
  "webrtc-offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc-ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
  "report-user": (data: { reason?: string }) => void;
  "direct-chat-request": (data: { email: string }) => void;
  "direct-message": (data: { conversationId: string; text: string }) => void;
  "direct-chat-leave": (data: { conversationId: string }) => void;
  "live-chat-message": (data: { text: string }) => void;
};

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): ChatSocket {
  return io(getBackendUrl(), {
    withCredentials: true,
    autoConnect: false,
  });
}
