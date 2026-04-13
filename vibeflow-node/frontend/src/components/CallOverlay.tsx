import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Volume2,
} from "lucide-react";
import { useWebRTCContext } from "./WebRTCProvider";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallOverlay() {
  const { call, localStream, remoteStream, acceptCall, declineCall, endCall } =
    useWebRTCContext();

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [duration, setDuration] = useState(0);
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (call?.state !== "active" || !call.startedAt) return;
    const timer = setInterval(() => {
      setDuration(Math.floor((Date.now() - (call.startedAt ?? Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [call?.state, call?.startedAt]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
  }, [isMuted, localStream]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => { t.enabled = !isCamOff; });
  }, [isCamOff, localStream]);

  if (!call || call.state === "idle") return null;

  const onPipMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pipPos.x, py: pipPos.y };
  };
  const onPipMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPipPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };
  const onPipMouseUp = () => { dragging.current = false; };

  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay"
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
        style={{ background: "rgba(8,4,12,0.97)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseMove={onPipMouseMove}
        onMouseUp={onPipMouseUp}
      >
        {/* Remote video (active call) */}
        {call.state === "active" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <track kind="captions" />
          </video>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Caller info */}
        <div className="relative z-10 flex flex-col items-center gap-4 mt-16">
          {/* Pulsing ring for outgoing */}
          <div className="relative">
            {call.state === "outgoing" && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#e91e63]/40"
                  animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#e91e63]/20"
                  animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
            <img
              src={call.remoteUserAvatar}
              alt={call.remoteUserName}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#e91e63]/60 shadow-2xl"
            />
          </div>

          <p className="text-white text-2xl font-semibold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            {call.remoteUserName}
          </p>

          {call.state === "outgoing" && (
            <p className="text-white/60 text-sm">Calling…</p>
          )}
          {call.state === "incoming" && (
            <p className="text-white/60 text-sm">Incoming {call.callType} call</p>
          )}
          {call.state === "active" && (
            <p className="text-[#e91e63] text-sm font-mono">{formatDuration(duration)}</p>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-6 z-10">
          {call.state === "incoming" ? (
            <>
              <button
                type="button"
                onClick={declineCall}
                aria-label="Decline call"
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <button
                type="button"
                onClick={() => { void acceptCall(); }}
                aria-label="Accept call"
                className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              >
                <Phone className="w-7 h-7 text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMuted((p) => !p)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isMuted ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
              {call.callType === "video" && (
                <button
                  type="button"
                  onClick={() => setIsCamOff((p) => !p)}
                  aria-label={isCamOff ? "Camera on" : "Camera off"}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isCamOff ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {isCamOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSpeaker((p) => !p)}
                aria-label="Toggle speaker"
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isSpeaker ? "bg-white/10 hover:bg-white/20" : "bg-white/20"}`}
              >
                <Volume2 className="w-6 h-6 text-white" />
              </button>
              <button
                type="button"
                onClick={endCall}
                aria-label="End call"
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Local video PiP — draggable */}
        {call.state === "active" && call.callType === "video" && (
          <section
            aria-label="Local camera preview"
            className="absolute bottom-36 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-move z-20"
            style={{ transform: `translate(${pipPos.x}px, ${pipPos.y}px)` }}
            onMouseDown={onPipMouseDown}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <track kind="captions" />
            </video>
          </section>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
