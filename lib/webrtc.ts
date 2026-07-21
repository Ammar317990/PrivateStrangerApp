const STUN_ONLY: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function createPeerConnection(iceServers: RTCIceServer[] = STUN_ONLY): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers });
}

export function attachLocalTracks(pc: RTCPeerConnection, stream: MediaStream) {
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
}
