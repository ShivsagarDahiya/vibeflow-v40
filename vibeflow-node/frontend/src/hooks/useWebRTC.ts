import { useState, useEffect, useRef, useCallback } from "react";
import type { CallSignal, CallState, UserId } from "@/types";

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface WebRTCState {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingSignal: CallSignal | null;
  startCall: (toUserId: UserId, actor: unknown) => Promise<void>;
  acceptCall: (signal: CallSignal, actor: unknown) => Promise<void>;
  endCall: (actor: unknown) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number; // seconds
}

export function useWebRTC(
  currentUserId: UserId | null,
  actor: unknown
): WebRTCState {
  const [callState, setCallState] = useState<CallState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<CallSignal | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteUserIdRef = useRef<UserId | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Send a signal via backend actor
  const sendSignal = useCallback(
    async (
      toId: UserId,
      type: CallSignal["signalType"],
      payload: string
    ) => {
      if (!actor || !currentUserId) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (actor as any).storeCallSignal(toId, type, payload);
      } catch (err) {
        console.error("sendSignal error:", err);
      }
    },
    [actor, currentUserId]
  );

  // Create RTCPeerConnection with ICE candidate handling
  const createPeerConnection = useCallback(
    (toId: UserId) => {
      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          sendSignal(toId, "ice", JSON.stringify(candidate));
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setCallState("idle");
          setRemoteStream(null);
        }
        if (pc.connectionState === "connected") {
          setCallState("connected");
          // Start duration timer
          durationRef.current = setInterval(() => {
            setCallDuration((d) => d + 1);
          }, 1000);
        }
      };

      return pc;
    },
    [sendSignal]
  );

  // Poll for incoming signals every 500ms
  useEffect(() => {
    if (!actor || !currentUserId) return;
    if (callState !== "idle" && callState !== "ringing") return;

    pollingRef.current = setInterval(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signals: CallSignal[] = await (actor as any).getCallSignals();
        if (!signals.length) return;

        for (const sig of signals) {
          if (sig.signalType === "offer" && callState === "idle") {
            setIncomingSignal(sig);
            setCallState("ringing");
            remoteUserIdRef.current = sig.fromId;
          } else if (sig.signalType === "answer" && pcRef.current) {
            const desc = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(desc));
          } else if (sig.signalType === "ice" && pcRef.current) {
            const candidate = JSON.parse(sig.payload) as RTCIceCandidateInit;
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else if (sig.signalType === "end") {
            cleanupCall();
          }
        }

        // Clear processed signals
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (actor as any).clearCallSignals();
      } catch {
        // Silently ignore polling errors
      }
    }, 500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, currentUserId, callState]);

  const cleanupCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => { t.stop(); });
    }
    if (durationRef.current) clearInterval(durationRef.current);
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setIncomingSignal(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    remoteUserIdRef.current = null;
  }, [localStream]);

  const startCall = useCallback(
    async (toUserId: UserId, _actor: unknown) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        setCallState("calling");
        remoteUserIdRef.current = toUserId;

        const pc = createPeerConnection(toUserId);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => { pc.addTrack(t, stream); });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(toUserId, "offer", JSON.stringify(offer));
      } catch (err) {
        console.error("startCall error:", err);
        cleanupCall();
      }
    },
    [createPeerConnection, sendSignal, cleanupCall]
  );

  const acceptCall = useCallback(
    async (signal: CallSignal, _actor: unknown) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        const pc = createPeerConnection(signal.fromId);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => { pc.addTrack(t, stream); });

        await pc.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(signal.payload) as RTCSessionDescriptionInit)
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(signal.fromId, "answer", JSON.stringify(answer));
        setCallState("connected");
      } catch (err) {
        console.error("acceptCall error:", err);
        cleanupCall();
      }
    },
    [createPeerConnection, sendSignal, cleanupCall]
  );

  const endCall = useCallback(
    (_actor: unknown) => {
      const toId = remoteUserIdRef.current;
      if (toId) sendSignal(toId, "end", "");
      cleanupCall();
    },
    [sendSignal, cleanupCall]
  );

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((c) => !c);
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    callState,
    localStream,
    remoteStream,
    incomingSignal,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
    isMuted,
    isCameraOff,
    callDuration,
  };
}
