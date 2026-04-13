import { useCallback, useEffect, useRef, useState } from "react";
import { useBackend } from "./useBackend";

export interface CallState {
  phase: "idle" | "calling" | "incoming" | "active";
  callType: "video" | "voice";
  remoteUsername: string;
  remoteAvatar: string;
  remotePrincipal: string;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
}

export interface UseWebRTCCallReturn {
  callState: CallState;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  startCall: (
    principalStr: string,
    username: string,
    avatarUrl: string,
    callType: "video" | "voice",
  ) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  hangup: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const DEFAULT_CALL_STATE: CallState = {
  phase: "idle",
  callType: "video",
  remoteUsername: "",
  remoteAvatar: "",
  remotePrincipal: "",
  isMuted: false,
  isCameraOff: false,
  callDuration: 0,
};

export function useWebRTCCall(): UseWebRTCCallReturn {
  const { backend, identity } = useBackend();
  const [callState, setCallState] = useState<CallState>(DEFAULT_CALL_STATE);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callerPrincipalRef = useRef<string>("");
  const processedSignalIds = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const callStateRef = useRef<CallState>(DEFAULT_CALL_STATE);

  // Keep ref in sync
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const storeSignal = useCallback(
    async (
      recipientPrincipal: string,
      signalType: string,
      payload: string,
      callType: string,
    ) => {
      if (!backend) return;
      try {
        const { Principal } = await import("@icp-sdk/core/principal");
        await backend.storeCallSignal(
          Principal.fromText(recipientPrincipal),
          signalType,
          payload,
          callType,
        );
      } catch {
        // fallback: use sendMessage for signaling
        try {
          const { Principal } = await import("@icp-sdk/core/principal");
          const signalMsg = `WEBRTC_SIGNAL::${signalType}::${callType}::${payload}`;
          await backend.sendMessage(
            Principal.fromText(recipientPrincipal),
            signalMsg,
          );
        } catch {
          // ignore
        }
      }
    },
    [backend],
  );

  const getLocalStream = useCallback(async (callType: "video" | "voice") => {
    try {
      const constraints =
        callType === "video"
          ? { audio: true, video: { facingMode: "user" } }
          : { audio: true, video: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
      } catch {
        return null;
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) track.stop();
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    pendingOfferRef.current = null;
    callerPrincipalRef.current = "";
    processedSignalIds.current.clear();
  }, []);

  // Poll for incoming signals via backend's getCallSignals
  useEffect(() => {
    if (!backend || !identity) return;

    const myPrincipal = identity.getPrincipal().toString();

    const pollSignals = async () => {
      const currentState = callStateRef.current;
      try {
        const signals = await backend.getCallSignals(null);
        const toProcess = (
          signals as Array<{
            id: string;
            signalType: string;
            callType: string;
            payload: string;
            caller: { toString(): string };
            callee: { toString(): string };
          }>
        ).filter((s) => {
          const calleeStr =
            typeof s.callee === "object"
              ? s.callee.toString()
              : String(s.callee);
          return (
            calleeStr === myPrincipal && !processedSignalIds.current.has(s.id)
          );
        });

        const processedIds: string[] = [];

        for (const signal of toProcess) {
          processedSignalIds.current.add(signal.id);
          processedIds.push(signal.id);

          const senderStr =
            typeof signal.caller === "object"
              ? signal.caller.toString()
              : String(signal.caller);
          const { signalType, callType, payload } = signal;

          if (signalType === "offer" && currentState.phase === "idle") {
            let remoteUsername = senderStr.slice(0, 8);
            let remoteAvatar = `https://i.pravatar.cc/100?u=${senderStr}`;
            try {
              const { Principal } = await import("@icp-sdk/core/principal");
              const profileOpt = await backend.getProfile(
                Principal.fromText(senderStr),
              );
              if (
                profileOpt &&
                typeof profileOpt === "object" &&
                "username" in profileOpt
              ) {
                remoteUsername = (
                  profileOpt as { username: string; avatarKey: string }
                ).username;
                if (
                  (profileOpt as { username: string; avatarKey: string })
                    .avatarKey
                ) {
                  remoteAvatar = (
                    profileOpt as { username: string; avatarKey: string }
                  ).avatarKey;
                }
              }
            } catch {}

            try {
              pendingOfferRef.current = JSON.parse(payload);
            } catch {
              continue;
            }
            callerPrincipalRef.current = senderStr;

            setCallState({
              phase: "incoming",
              callType: (callType as "video" | "voice") || "video",
              remoteUsername,
              remoteAvatar,
              remotePrincipal: senderStr,
              isMuted: false,
              isCameraOff: false,
              callDuration: 0,
            });
          } else if (
            signalType === "answer" &&
            currentState.phase === "calling" &&
            senderStr === currentState.remotePrincipal
          ) {
            try {
              const answer = JSON.parse(payload);
              if (pcRef.current)
                await pcRef.current.setRemoteDescription(
                  new RTCSessionDescription(answer),
                );
              setCallState((prev) => ({ ...prev, phase: "active" }));
              if (durationIntervalRef.current)
                clearInterval(durationIntervalRef.current);
              durationIntervalRef.current = setInterval(() => {
                setCallState((prev) => ({
                  ...prev,
                  callDuration: prev.callDuration + 1,
                }));
              }, 1000);
            } catch {}
          } else if (
            signalType === "ice" &&
            (currentState.phase === "calling" ||
              currentState.phase === "active" ||
              currentState.phase === "incoming") &&
            (senderStr === currentState.remotePrincipal ||
              senderStr === callerPrincipalRef.current)
          ) {
            try {
              const candidate = JSON.parse(payload);
              if (pcRef.current)
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(candidate),
                );
            } catch {}
          } else if (
            (signalType === "hangup" || signalType === "decline") &&
            currentState.phase !== "idle"
          ) {
            cleanup();
            setCallState(DEFAULT_CALL_STATE);
          }
        }

        // Clear processed signals to keep backend clean
        if (processedIds.length > 0) {
          try {
            await backend.clearCallSignals(processedIds);
          } catch {}
        }
      } catch {}
    };

    pollIntervalRef.current = setInterval(pollSignals, 3000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [backend, identity, cleanup]);

  const startCall = useCallback(
    async (
      principalStr: string,
      username: string,
      avatarUrl: string,
      callType: "video" | "voice",
    ) => {
      cleanup();

      const stream = await getLocalStream(callType);
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          storeSignal(
            principalStr,
            "ice",
            JSON.stringify(event.candidate.toJSON()),
            callType,
          );
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setCallState(DEFAULT_CALL_STATE);
          cleanup();
        }
      };

      pcRef.current = pc;

      if (stream) {
        for (const track of stream.getTracks()) pc.addTrack(track, stream);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await storeSignal(principalStr, "offer", JSON.stringify(offer), callType);

      setCallState({
        phase: "calling",
        callType,
        remoteUsername: username,
        remoteAvatar: avatarUrl,
        remotePrincipal: principalStr,
        isMuted: false,
        isCameraOff: false,
        callDuration: 0,
      });
    },
    [cleanup, getLocalStream, storeSignal],
  );

  const answerCall = useCallback(async () => {
    if (!pendingOfferRef.current || !callerPrincipalRef.current) return;

    const callerPrincipal = callerPrincipalRef.current;
    const callType = callStateRef.current.callType;
    const stream = await getLocalStream(callType);

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        storeSignal(
          callerPrincipal,
          "ice",
          JSON.stringify(event.candidate.toJSON()),
          callType,
        );
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        setCallState(DEFAULT_CALL_STATE);
        cleanup();
      }
    };

    pcRef.current = pc;

    if (stream) {
      for (const track of stream.getTracks()) pc.addTrack(track, stream);
    }

    await pc.setRemoteDescription(
      new RTCSessionDescription(pendingOfferRef.current),
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await storeSignal(
      callerPrincipal,
      "answer",
      JSON.stringify(answer),
      callType,
    );

    pendingOfferRef.current = null;
    setCallState((prev) => ({ ...prev, phase: "active" }));

    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);
  }, [getLocalStream, storeSignal, cleanup]);

  const declineCall = useCallback(async () => {
    const callerPrincipal = callerPrincipalRef.current;
    const callType = callStateRef.current.callType;
    if (callerPrincipal)
      await storeSignal(callerPrincipal, "decline", "", callType);
    cleanup();
    setCallState(DEFAULT_CALL_STATE);
  }, [storeSignal, cleanup]);

  const hangup = useCallback(async () => {
    const { remotePrincipal, callType } = callStateRef.current;
    if (remotePrincipal)
      await storeSignal(remotePrincipal, "hangup", "", callType);
    cleanup();
    setCallState(DEFAULT_CALL_STATE);
  }, [storeSignal, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getAudioTracks()) {
        track.enabled = !track.enabled;
      }
    }
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getVideoTracks()) {
        track.enabled = !track.enabled;
      }
    }
    setCallState((prev) => ({ ...prev, isCameraOff: !prev.isCameraOff }));
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    declineCall,
    hangup,
    toggleMute,
    toggleCamera,
  };
}
