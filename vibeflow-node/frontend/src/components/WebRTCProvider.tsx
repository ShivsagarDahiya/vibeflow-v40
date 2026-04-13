import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CallSession, CallState, CallSignal } from "@/types/chat";

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface WebRTCContextValue {
  call: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (userId: string, userName: string, userAvatar: string, type: "video" | "audio") => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

export function useWebRTCContext() {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("useWebRTCContext must be used inside WebRTCProvider");
  return ctx;
}

const MY_USER_ID = "me";
const API = "/api";

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const [call, setCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => { t.stop(); });
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCall(null);
  }, [localStream]);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    const rs = new MediaStream();
    setRemoteStream(rs);

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => { rs.addTrack(t); });
      setRemoteStream(new MediaStream(rs.getTracks()));
    };

    pc.onicecandidate = async (e) => {
      if (e.candidate && call) {
        await storeSignal({
          type: "ice",
          from: MY_USER_ID,
          to: call.remoteUserId,
          payload: JSON.stringify(e.candidate),
          createdAt: new Date().toISOString(),
        });
      }
    };

    return pc;
  }, [call]);

  const storeSignal = async (signal: CallSignal) => {
    try {
      await fetch(`${API}/call/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signal),
      });
    } catch {
      // ignore network errors during signaling
    }
  };

  const getSignals = useCallback(async (): Promise<CallSignal[]> => {
    try {
      const res = await fetch(`${API}/call/signals/${MY_USER_ID}`);
      if (res.ok) return res.json();
    } catch {
      // ignore
    }
    return [];
  }, []);

  const clearSignals = useCallback(async () => {
    try {
      await fetch(`${API}/call/signals/${MY_USER_ID}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }, []);

  // Poll for incoming signals every 500ms
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const signals = await getSignals();
      if (signals.length === 0) return;

      for (const sig of signals) {
        if (sig.type === "offer" && !call) {
          // Incoming call
          setCall({
            state: "incoming",
            callType: "video",
            remoteUserId: sig.from,
            remoteUserName: sig.from,
            remoteUserAvatar: `https://i.pravatar.cc/80?u=${sig.from}`,
          });
        } else if (sig.type === "answer" && pcRef.current) {
          const answer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCall((prev) => prev ? { ...prev, state: "active", startedAt: Date.now() } : prev);
        } else if (sig.type === "ice" && pcRef.current) {
          const candidate = JSON.parse(sig.payload) as RTCIceCandidateInit;
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else if (sig.type === "end") {
          cleanup();
        }
      }

      await clearSignals();
    }, 500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [call, getSignals, clearSignals, cleanup]);

  const startCall = useCallback(
    async (userId: string, userName: string, userAvatar: string, type: "video" | "audio") => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      }).catch(() => new MediaStream());

      setLocalStream(stream);
      setCall({
        state: "outgoing",
        callType: type,
        remoteUserId: userId,
        remoteUserName: userName,
        remoteUserAvatar: userAvatar,
      });

      const pc = createPC();
      pcRef.current = pc;
      stream.getTracks().forEach((t) => { pc.addTrack(t, stream); });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await storeSignal({
        type: "offer",
        from: MY_USER_ID,
        to: userId,
        payload: JSON.stringify(offer),
        createdAt: new Date().toISOString(),
      });
    },
    [createPC]
  );

  const acceptCall = useCallback(async () => {
    if (!call || call.state !== "incoming") return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: call.callType === "video",
      audio: true,
    }).catch(() => new MediaStream());

    setLocalStream(stream);

    const pc = createPC();
    pcRef.current = pc;
    stream.getTracks().forEach((t) => { pc.addTrack(t, stream); });

    const signals = await getSignals();
    const offerSig = signals.find((s) => s.type === "offer" && s.from === call.remoteUserId);
    if (offerSig) {
      const offer = JSON.parse(offerSig.payload) as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await storeSignal({
        type: "answer",
        from: MY_USER_ID,
        to: call.remoteUserId,
        payload: JSON.stringify(answer),
        createdAt: new Date().toISOString(),
      });
    }

    setCall((prev) => prev ? { ...prev, state: "active", startedAt: Date.now() } : prev);
  }, [call, createPC, getSignals]);

  const declineCall = useCallback(() => {
    if (call) {
      storeSignal({
        type: "end",
        from: MY_USER_ID,
        to: call.remoteUserId,
        payload: "",
        createdAt: new Date().toISOString(),
      });
    }
    cleanup();
  }, [call, cleanup]);

  const endCall = useCallback(() => {
    if (call) {
      storeSignal({
        type: "end",
        from: MY_USER_ID,
        to: call.remoteUserId,
        payload: "",
        createdAt: new Date().toISOString(),
      });
    }
    cleanup();
  }, [call, cleanup]);

  return (
    <WebRTCContext.Provider
      value={{ call, localStream, remoteStream, startCall, acceptCall, declineCall, endCall }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}
