import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Heart,
  Flame,
  Star,
  Smile,
  Share2,
  AlertCircle,
} from "lucide-react";
import {
  useActiveLiveRoom,
  useLiveChatMessages,
  useSendLiveMessage,
  useLeaveLiveRoom,
  useCreateLiveRoom,
  useJoinLiveRoom,
} from "../hooks/useProfile";
import { useMyProfile } from "../hooks/useProfile";
import { formatCount } from "../lib/format";
import { toast } from "sonner";

const EMOJI_REACTIONS = ["❤️", "🔥", "😍", "👏", "💯", "🎉"];

function formatDuration(startedAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function FloatingEmoji({ emoji, id }: { emoji: string; id: number }) {
  return (
    <div
      key={id}
      className="absolute bottom-16 pointer-events-none text-2xl animate-float-up"
      style={{ left: `${15 + Math.random() * 70}%` }}
    >
      {emoji}
    </div>
  );
}

export default function LiveRoomPage() {
  const { id: roomId = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();

  const { data: room, isLoading: roomLoading } = useActiveLiveRoom(roomId);
  const { data: messages } = useLiveChatMessages(roomId);
  const sendMessage = useSendLiveMessage();
  const leaveRoom = useLeaveLiveRoom();
  const createRoom = useCreateLiveRoom();
  const joinRoom = useJoinLiveRoom(roomId);

  const [text, setText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [timer, setTimer] = useState("0:00");
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ emoji: string; id: number }>>([]);
  const [emojiCounter, setEmojiCounter] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isHost = profile?.id === room?.hostId;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }); // run after every render — fine for chat scroll

  // Duration timer
  useEffect(() => {
    if (!room?.startedAt) return;
    const tick = () => setTimer(formatDuration(room.startedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room?.startedAt]);

  // Start camera if host
  useEffect(() => {
    if (!isHost) return;
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => { t.stop(); }); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => toast.error("Could not access camera"));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => { t.stop(); });
    };
  }, [isHost]);

  // Join room on mount (viewer)
  const joinRoomMutate = joinRoom.mutate;
  useEffect(() => {
    if (!isHost && roomId) {
      joinRoomMutate();
    }
  }, [isHost, roomId, joinRoomMutate]);

  const toggleMute = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((v) => !v);
  }, []);

  const toggleCamera = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((v) => !v);
  }, []);

  const handleSend = useCallback(async () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    try {
      await sendMessage.mutateAsync({ roomId, text: msg });
    } catch {
      toast.error("Failed to send message");
    }
  }, [text, roomId, sendMessage]);

  const handleReaction = useCallback((emoji: string) => {
    setFloatingEmojis((prev) => [...prev.slice(-8), { emoji, id: emojiCounter }]);
    setEmojiCounter((c) => c + 1);
    sendMessage.mutate({ roomId, text: "", emoji });
  }, [emojiCounter, roomId, sendMessage]);

  const handleLeave = useCallback(async () => {
    try {
      await leaveRoom.mutateAsync(roomId);
    } finally {
      navigate(-1);
    }
  }, [leaveRoom, roomId, navigate]);

  const handleStartLive = async () => {
    try {
      const newRoom = await createRoom.mutateAsync("My Live Room");
      navigate(`/live/${newRoom.id}`, { replace: true });
    } catch {
      toast.error("Could not start live stream");
    }
  };

  if (!roomId) {
    // Start live UI
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-6 bg-dark" data-ocid="start-live-page">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
          <Video className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold text-white mb-2">Go Live</h1>
          <p className="text-white/50 text-sm">Start a live stream and connect with your fans in real-time</p>
        </div>
        <button
          type="button"
          onClick={handleStartLive}
          disabled={createRoom.isPending}
          className="w-full max-w-xs h-12 btn-love rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          data-ocid="start-live-btn"
        >
          {createRoom.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Video className="w-4 h-4" /> Start Live</>}
        </button>
      </div>
    );
  }

  if (roomLoading) {
    return (
      <div className="flex flex-col h-full bg-dark">
        <div className="flex-1 skeleton" />
        <div className="h-48 bg-surface-high" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-white/50" data-ocid="live-not-found">
        <AlertCircle className="w-12 h-12" />
        <p>Live room not found or has ended</p>
        <button type="button" onClick={() => navigate(-1)} className="text-primary text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-dark overflow-hidden" data-ocid="live-room-page">
      {/* Video background */}
      <div className="absolute inset-0">
        {isHost ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isCameraOff ? "invisible" : ""}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-300 to-dark flex items-center justify-center">
            <div className="text-center text-white/30">
              <Video className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Connecting to stream...</p>
            </div>
          </div>
        )}
        {(isCameraOff && isHost) && (
          <div className="absolute inset-0 bg-dark-100 flex items-center justify-center">
            <VideoOff className="w-16 h-16 text-white/20" />
          </div>
        )}
        {/* Dark overlay for chat readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-dark/40" />
      </div>

      {/* Floating emoji reactions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmojis.map((e) => <FloatingEmoji key={e.id} emoji={e.emoji} id={e.id} />)}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 pt-safe">
        <div className="flex items-center gap-3">
          <img src={room.hostAvatar} alt={room.hostName} className="w-9 h-9 rounded-full ring-2 ring-primary" loading="lazy" />
          <div>
            <div className="text-white text-sm font-semibold">{room.hostName}</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-primary rounded-full px-2 py-0.5 text-white font-semibold">
                🔴 LIVE
              </span>
              <span className="text-white/50 text-xs">{timer}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass-dark px-2.5 py-1 rounded-full text-white/70 text-sm">
            <Users className="w-3.5 h-3.5" />
            <span>{formatCount(room.viewerCount)}</span>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Link copied!")}
            className="w-9 h-9 rounded-full glass-dark flex items-center justify-center text-white/70"
            aria-label="Share live"
            data-ocid="live-share-btn"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="w-9 h-9 rounded-full bg-red-500/80 flex items-center justify-center text-white"
            aria-label="Leave stream"
            data-ocid="live-leave-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat + controls */}
      <div className="relative z-10 mt-auto">
        {/* Chat messages */}
        <div className="h-48 overflow-y-auto scrollbar-hide px-4 space-y-2 pb-2">
          {(messages ?? []).map((msg) => (
            <div key={msg.id} className="flex items-end gap-2 animate-fade-in" data-ocid="live-chat-msg">
              <img src={msg.senderAvatar} alt={msg.senderName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" loading="lazy" />
              <div className="glass-dark rounded-2xl rounded-bl-sm px-3 py-1.5 max-w-[80%]">
                <span className="text-primary text-xs font-semibold mr-1.5">{msg.senderName}</span>
                <span className="text-white text-sm">{msg.emoji ?? msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Emoji bar */}
        <div className="flex gap-2 px-4 mb-3 overflow-x-auto scrollbar-hide">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReaction(emoji)}
              className="flex-shrink-0 w-10 h-10 rounded-full glass-dark flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform"
              data-ocid={`reaction-${emoji}`}
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input + controls */}
        <div className="flex items-center gap-2 px-4 pb-safe pb-6">
          <div className="flex-1 flex items-center gap-2 glass-dark rounded-full px-4 h-11">
            <Smile className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Say something..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              data-ocid="live-chat-input"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-11 h-11 btn-love rounded-full flex items-center justify-center disabled:opacity-40"
            aria-label="Send message"
            data-ocid="live-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>

          {isHost && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500/80" : "glass-dark"} text-white`}
                aria-label={isMuted ? "Unmute" : "Mute"}
                data-ocid="live-mute-btn"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? "bg-red-500/80" : "glass-dark"} text-white`}
                aria-label={isCameraOff ? "Enable camera" : "Disable camera"}
                data-ocid="live-cam-btn"
              >
                {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
