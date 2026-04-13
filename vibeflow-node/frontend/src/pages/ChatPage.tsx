import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Image,
  Mic,
  Send,
  Check,
  CheckCheck,
  Pin,
  CornerUpLeft,
  X,
  ChevronDown,
} from "lucide-react";
import { useMessages, useConversations } from "@/hooks/useChat";
import type { ChatMessage } from "@/types/chat";
import { useWebRTCContext } from "@/components/WebRTCProvider";

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "🔥", "🎉"];

// ── helpers ───────────────────────────────────────────────────────────────────

function timeFmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function timeGroupLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
}

function DeliveryIcon({ status }: { status: ChatMessage["deliveryStatus"] }) {
  if (status === "sending") return <span className="text-white/30 text-[10px]">●</span>;
  if (status === "sent") return <Check className="w-3 h-3 text-white/50" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-white/50" />;
  return <CheckCheck className="w-3 h-3 text-[#e91e63]" />;
}

// ── Bubble ────────────────────────────────────────────────────────────────────

interface BubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  onReact: (id: string, emoji: string) => void;
  onReply: (msg: ChatMessage) => void;
}

function Bubble({ msg, isMine, onReact, onReply }: BubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    longPressRef.current = setTimeout(() => setShowPicker(true), 420);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  if (msg.isDeleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-0.5`}>
        <p className="text-white/30 text-xs italic px-3 py-2 rounded-2xl border border-white/10">
          Message deleted
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-0.5`}>
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[78%]`}>
        {/* Reply preview */}
        {msg.replyTo && (
          <div
            className={`text-xs px-3 py-1.5 rounded-t-xl rounded-b-sm mb-0.5 border-l-2 border-[#e91e63] ${isMine ? "bg-white/5 self-end" : "bg-white/5 self-start"}`}
            style={{ maxWidth: "100%" }}
          >
            <p className="text-[#e91e63] font-medium truncate">{msg.replyTo.senderName}</p>
            <p className="text-white/50 truncate">{msg.replyTo.text}</p>
          </div>
        )}

        {/* Bubble — button for long-press reaction */}
        <div className="relative">
          <button
            type="button"
            className="text-left bg-transparent border-0 p-0 block"
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onContextMenu={(e) => { e.preventDefault(); setShowPicker(true); }}
            aria-label="Hold to react"
          >
            <div
              className="px-4 py-2.5 text-sm leading-relaxed text-white"
              style={{
                borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMine
                  ? "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: isMine ? "0 2px 12px rgba(233,30,99,0.3)" : "none",
              }}
            >
              {msg.text}
            </div>
          </button>

          {/* Reactions badge */}
          {msg.reactions.length > 0 && (
            <div
              className={`absolute -bottom-3 ${isMine ? "right-1" : "left-1"} flex gap-0.5 bg-[#1e1020] rounded-full px-1.5 py-0.5 shadow-lg z-10`}
            >
              {msg.reactions.map((r) => (
                <span key={`${r.userId}-${r.emoji}`} className="text-sm">{r.emoji}</span>
              ))}
            </div>
          )}
        </div>

        {/* Time + delivery */}
        <div className={`flex items-center gap-1 mt-1.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-white/30 text-[10px]">{timeFmt(msg.createdAt)}</span>
          {isMine && <DeliveryIcon status={msg.deliveryStatus} />}
          {msg.isPinned && <Pin className="w-3 h-3 text-[#f4a460]" />}
        </div>
      </div>

      {/* Emoji picker popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            className={`fixed z-50 bottom-36 ${isMine ? "right-4" : "left-4"}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="flex gap-2 bg-[#1e1020] rounded-2xl px-3 py-2.5 shadow-2xl border border-white/10">
              {EMOJI_REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { onReact(msg.id, e); setShowPicker(false); }}
                  className="text-xl hover:scale-125 transition-transform active:scale-95"
                  aria-label={`React with ${e}`}
                >
                  {e}
                </button>
              ))}
              <div className="w-px bg-white/10 mx-1" />
              <button
                type="button"
                onClick={() => { onReply(msg); setShowPicker(false); }}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Reply to message"
              >
                <CornerUpLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for picker */}
      {showPicker && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-transparent border-0 cursor-default"
          onClick={() => setShowPicker(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowPicker(false); }}
          aria-label="Close reaction picker"
        />
      )}
    </div>
  );
}

// ── TypingIndicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-6 py-2">
      <div className="flex gap-1 px-3 py-2.5 rounded-2xl bg-white/8" style={{ background: "rgba(255,255,255,0.08)" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/50"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-white/30 text-xs">typing…</span>
    </div>
  );
}

// ── ChatPage ──────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const convId = id ?? "conv-1";

  const { conversations } = useConversations();
  const conv = conversations.find((c) => c.id === convId);

  const { messages, loading, isTyping, pinnedMessage, sendMessage, reactToMessage, updateTyping } =
    useMessages(convId);

  const { startCall } = useWebRTCContext();

  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showPinned, setShowPinned] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMsgCount = useRef(0);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMsgCount.current = messages.length;
    }
  }, [messages]);

  const onScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 200);
  };

  const handleInput = (val: string) => {
    setInputText(val);
    void updateTyping(val.length > 0);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { void updateTyping(false); }, 2000);
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText.trim(), replyTo ? {
      messageId: replyTo.id,
      senderName: replyTo.senderName,
      text: replyTo.text,
    } : undefined);
    setInputText("");
    setReplyTo(null);
    void updateTyping(false);
  }, [inputText, replyTo, sendMessage, updateTyping]);

  // Group messages by date
  const groupedMessages: { label: string; messages: ChatMessage[] }[] = [];
  let lastLabel = "";
  for (const msg of messages) {
    const label = timeGroupLabel(msg.createdAt);
    if (label !== lastLabel) {
      groupedMessages.push({ label, messages: [msg] });
      lastLabel = label;
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const name = conv?.participantName ?? "Chat";
  const avatar = conv?.participantAvatar ?? `https://i.pravatar.cc/80?u=${convId}`;
  const isOnline = conv?.participantIsOnline ?? false;

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0d0610" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/8"
        style={{ background: "linear-gradient(180deg,#1a0a14 0%,#0d0610 100%)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0610]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{name}</p>
          <p className="text-white/40 text-xs">
            {isTyping ? (
              <span className="text-[#e91e63] italic">typing…</span>
            ) : isOnline ? (
              "Active now"
            ) : (
              conv?.lastActiveAt ? `Active ${timeGroupLabel(conv.lastActiveAt).toLowerCase()}` : "Offline"
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { void startCall(conv?.participantId ?? "", name, avatar, "audio"); }}
            aria-label="Voice call"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#e91e63] hover:bg-[#e91e63]/10 transition-colors"
            data-ocid="voice-call-btn"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => { void startCall(conv?.participantId ?? "", name, avatar, "video"); }}
            aria-label="Video call"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#e91e63] hover:bg-[#e91e63]/10 transition-colors"
            data-ocid="video-call-btn"
          >
            <Video className="w-5 h-5" />
          </button>
          <button type="button" aria-label="More options" className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pinned message bar */}
      <AnimatePresence>
        {pinnedMessage && showPinned && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-[#e91e63]/20"
            style={{ background: "rgba(233,30,99,0.08)" }}
          >
            <Pin className="w-3 h-3 text-[#e91e63] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[#e91e63] text-[10px] uppercase font-semibold tracking-wider">Pinned</p>
              <p className="text-white/70 text-xs truncate">{pinnedMessage.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPinned(false)}
              aria-label="Dismiss pinned"
              className="text-white/30 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 overscroll-contain"
        onScroll={onScroll}
      >
        {loading ? (
          <div className="space-y-4 px-4 py-4">
            {[...Array(5)].map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={`skel-${i}`} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div
                  className="h-10 rounded-2xl bg-white/10 animate-pulse"
                  style={{ width: `${40 + (i * 17) % 30}%` }}
                />
              </div>
            ))}
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="flex items-center gap-3 px-6 py-3">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-white/30 text-[10px] font-medium uppercase tracking-wide">{group.label}</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
              {group.messages.map((msg) => (
                <Bubble
                  key={msg.id}
                  msg={msg}
                  isMine={msg.senderId === "me"}
                  onReact={reactToMessage}
                  onReply={(m) => setReplyTo(m)}
                />
              ))}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            aria-label="Scroll to bottom"
            className="absolute right-4 bottom-24 w-9 h-9 rounded-full bg-[#e91e63] flex items-center justify-center shadow-lg z-30"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t border-[#e91e63]/20"
            style={{ background: "rgba(233,30,99,0.06)" }}
          >
            <CornerUpLeft className="w-4 h-4 text-[#e91e63] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[#e91e63] text-xs font-medium">{replyTo.senderName}</p>
              <p className="text-white/50 text-xs truncate">{replyTo.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="text-white/30 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-3 py-3 border-t border-white/6 safe-bottom"
        style={{ background: "#12090f", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-end gap-2">
          {/* Left icons (shown when empty) */}
          <AnimatePresence>
            {!inputText && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-1 overflow-hidden"
              >
                <button type="button" aria-label="Camera" className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </button>
                <button type="button" aria-label="Gallery" className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <Image className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bubble */}
          <div className="flex-1 flex items-end gap-2 rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.07)", minHeight: "44px" }}>
            <textarea
              value={inputText}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Message…"
              rows={1}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none resize-none leading-5 max-h-28 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
              data-ocid="chat-input"
            />
            <button type="button" aria-label="Emoji" className="text-white/40 hover:text-white transition-colors flex-shrink-0 self-end pb-0.5">
              <Smile className="w-5 h-5" />
            </button>
            <button type="button" aria-label="Attach" className="text-white/40 hover:text-white transition-colors flex-shrink-0 self-end pb-0.5">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Send or mic */}
          {inputText ? (
            <motion.button
              key="send"
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => { void handleSend(); }}
              aria-label="Send message"
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ background: "linear-gradient(135deg,#e91e63,#c2185b)" }}
              data-ocid="send-btn"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onPointerDown={() => setIsRecording(true)}
              onPointerUp={() => setIsRecording(false)}
              aria-label="Voice message — hold to record"
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: isRecording
                  ? "linear-gradient(135deg,#e91e63,#c2185b)"
                  : "rgba(255,255,255,0.1)",
              }}
              data-ocid="voice-record-btn"
            >
              <Mic className={`w-5 h-5 ${isRecording ? "text-white" : "text-white/60"}`} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
