import {
  CheckCheck,
  Edit2,
  Forward,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Search,
  Send,
  Smile,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCallContext } from "../components/WebRTCCallProvider";
import { useBackend } from "../hooks/useBackend";
import { timeAgo } from "../types/app";

interface ChatMessage {
  id: string;
  text: string;
  senderPrincipal: string;
  createdAt: bigint;
  isMe: boolean;
  reaction?: string;
  replyTo?: { id: string; text: string };
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  isForwarded?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  voiceUrl?: string;
  voiceDuration?: number;
  disappearsAt?: number;
}

interface ContextMenu {
  messageId: string;
  isMe: boolean;
  x: number;
  y: number;
}

const REACTION_EMOJIS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "🔥",
  "👍",
  "🙌",
  "😍",
  "🤩",
  "😭",
  "💯",
  "🎉",
  "🤣",
  "💀",
];

function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 mb-2">
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center"
        style={{
          background: "oklch(0.18 0.018 15)",
          border: "1px solid oklch(0.25 0.025 15)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: "oklch(0.65 0.22 10)" }}
            animate={{ y: [-3, 3, -3] }}
            transition={{
              duration: 0.6,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ReadReceipt({ isMe, isLast }: { isMe: boolean; isLast: boolean }) {
  if (!isMe || !isLast) return null;
  return (
    <div className="flex justify-end pr-1 -mt-1 mb-1">
      <CheckCheck size={13} style={{ color: "oklch(0.55 0.18 240)" }} />
    </div>
  );
}

function VoiceWaveform({
  duration,
  isMe,
}: { duration: number; isMe: boolean }) {
  const bars = Array.from(
    { length: 20 },
    (_, i) => (Math.sin(i * 0.8) * 0.5 + 0.5) * 20 + 4,
  );
  return (
    <div className="flex items-center gap-2 py-1 min-w-[120px]">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: isMe
            ? "oklch(0.98 0 0 / 0.2)"
            : "oklch(0.65 0.22 10 / 0.2)",
        }}
      >
        <Mic
          size={14}
          style={{ color: isMe ? "oklch(0.98 0 0)" : "oklch(0.65 0.22 10)" }}
        />
      </div>
      <div className="flex items-center gap-0.5 flex-1">
        {bars.map((h) => (
          <div
            key={h}
            className="w-0.5 rounded-full flex-shrink-0"
            style={{
              height: `${h}px`,
              background: isMe
                ? "oklch(0.98 0 0 / 0.6)"
                : "oklch(0.65 0.22 10 / 0.7)",
            }}
          />
        ))}
      </div>
      <span
        className="text-[10px] font-mono shrink-0"
        style={{
          color: isMe ? "oklch(0.90 0.010 15)" : "oklch(0.60 0.010 15)",
        }}
      >
        {Math.floor(duration / 60)}:
        {(duration % 60).toString().padStart(2, "0")}
      </span>
    </div>
  );
}

export default function ChatPage({
  otherPrincipal,
  username,
  avatarUrl,
  onBack,
}: {
  otherPrincipal: string;
  username: string;
  avatarUrl: string;
  onBack: () => void;
}) {
  const { backend, identity } = useBackend();
  const callContext = useCallContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [_showPinnedBanner, setShowPinnedBanner] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [showQuickEmoji, setShowQuickEmoji] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [allUsers, setAllUsers] = useState<
    { principal: string; username: string; avatarUrl: string }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const myPrincipal = identity?.getPrincipal().toString() ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!backend) return;
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const other = Principal.fromText(otherPrincipal);
      const raw = await backend.getMessages(other);
      const resolved: ChatMessage[] = (
        raw as Array<{
          id: string;
          text: string;
          sender: { toString(): string } | string;
          createdAt: bigint;
        }>
      )
        .map((m) => {
          const sender =
            typeof m.sender === "object"
              ? m.sender.toString()
              : String(m.sender);
          const isMe = sender === myPrincipal;
          let isDeleted = false;
          let isForwarded = false;
          let isEdited = false;
          let replyTo: { id: string; text: string } | undefined;
          let actualText = m.text;

          if (m.text.startsWith("DELETED::")) {
            isDeleted = true;
            actualText = "This message was deleted";
          }
          if (m.text.startsWith("FORWARDED::")) {
            isForwarded = true;
            actualText = m.text.replace("FORWARDED::", "");
          }
          if (m.text.startsWith("EDITED::")) {
            isEdited = true;
            actualText = m.text.replace("EDITED::", "");
          }
          if (m.text.startsWith("REPLY::")) {
            const parts = m.text.split("::REPLYTEXT::");
            replyTo = {
              id: parts[0].replace("REPLY::", ""),
              text: parts[1]?.split("::MSG::")[0] || "",
            };
            actualText = parts[1]?.split("::MSG::")[1] || m.text;
          }

          return {
            id: m.id,
            text: actualText,
            senderPrincipal: sender,
            createdAt: m.createdAt,
            isMe,
            isDeleted,
            isForwarded,
            isEdited,
            replyTo,
          };
        })
        .filter((m) => !m.text.startsWith("WEBRTC_SIGNAL::"));
      setMessages(resolved);
    } catch {}
  }, [backend, otherPrincipal, myPrincipal]);

  const loadPinnedMessages = useCallback(async () => {
    if (!backend) return;
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const raw = await backend.getPinnedMessages(
        Principal.fromText(otherPrincipal),
      );
      const pinned: ChatMessage[] = (
        raw as Array<{
          id: string;
          text: string;
          sender: { toString(): string } | string;
          createdAt: bigint;
        }>
      ).map((m) => ({
        id: m.id,
        text: m.text,
        senderPrincipal:
          typeof m.sender === "object" ? m.sender.toString() : String(m.sender),
        createdAt: m.createdAt,
        isMe:
          (typeof m.sender === "object"
            ? m.sender.toString()
            : String(m.sender)) === myPrincipal,
        isPinned: true,
      }));
      setPinnedMessages(pinned);
    } catch {}
  }, [backend, otherPrincipal, myPrincipal]);

  const loadOnlineStatus = useCallback(async () => {
    if (!backend) return;
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const status = await backend.getActivityStatus(
        Principal.fromText(otherPrincipal),
      );
      setOnlineStatus(status === "online");
    } catch {}
  }, [backend, otherPrincipal]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    loadMessages();
    loadPinnedMessages();
    loadOnlineStatus();
    const interval = setInterval(() => {
      loadMessages();
      loadOnlineStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [backend, otherPrincipal]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll only when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!backend || sending) return;
    const msgText = editingId
      ? text.trim()
      : replyTo
        ? `REPLY::${replyTo.id}::REPLYTEXT::${replyTo.text}::MSG::${text.trim()}`
        : text.trim();
    if (!msgText) return;

    setSending(true);
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const other = Principal.fromText(otherPrincipal);
      if (editingId) {
        await backend.sendMessage(other, `EDITED::${text.trim()}`);
        setEditingId(null);
      } else {
        await backend.sendMessage(other, msgText);
      }
      setText("");
      setReplyTo(null);
      await loadMessages();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = async (val: string) => {
    setText(val);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIsTyping(true);
    try {
      await backend?.updateActivityStatus("typing");
    } catch {}
    typingTimer.current = setTimeout(() => setIsTyping(false), 5000);
  };

  const handleLongPressStart = (
    msgId: string,
    isMe: boolean,
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ messageId: msgId, isMe, x: rect.left, y: rect.top });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reaction: emoji } : m)),
    );
    setReactionTarget(null);
    try {
      await backend?.addMessageReaction(msgId, emoji);
    } catch {}
  };

  const handlePin = async (msgId: string) => {
    try {
      await backend?.pinMessage(msgId);
      await loadPinnedMessages();
    } catch {}
    setContextMenu(null);
  };

  const handleDeleteForMe = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setContextMenu(null);
  };

  const handleDeleteForEveryone = async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    const ageMs = Date.now() - Number(msg.createdAt) / 1_000_000;
    if (ageMs < 5 * 60 * 1000) {
      try {
        const { Principal } = await import("@icp-sdk/core/principal");
        await backend?.sendMessage(
          Principal.fromText(otherPrincipal),
          `DELETED::${msgId}`,
        );
      } catch {}
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, isDeleted: true, text: "This message was deleted" }
          : m,
      ),
    );
    setContextMenu(null);
  };

  const handleEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setText(msg.text);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleForward = (msg: ChatMessage) => {
    setForwardMsg(msg);
    setContextMenu(null);
    backend
      ?.getAllUsers()
      .then(
        (
          users: Array<{
            principal: { toString(): string };
            username: string;
            avatarKey: string;
          }>,
        ) => {
          setAllUsers(
            users.map((u) => ({
              principal: u.principal.toString(),
              username: u.username,
              avatarUrl:
                u.avatarKey ||
                `https://i.pravatar.cc/100?u=${u.principal.toString()}`,
            })),
          );
        },
      )
      .catch(() => {});
  };

  const doForward = async (toPrincipal: string) => {
    if (!forwardMsg || !backend) return;
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      await backend.sendMessage(
        Principal.fromText(toPrincipal),
        `FORWARDED::${forwardMsg.text}`,
      );
    } catch {}
    setForwardMsg(null);
  };

  const startVoiceRecord = () => {
    setIsRecordingVoice(true);
    setVoiceSeconds(0);
    voiceTimer.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
  };

  const stopVoiceRecord = async () => {
    if (voiceTimer.current) clearInterval(voiceTimer.current);
    setIsRecordingVoice(false);
    // Send voice placeholder message
    const dur = voiceSeconds;
    setVoiceSeconds(0);
    if (!backend || dur < 1) return;
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      await backend.sendMessage(
        Principal.fromText(otherPrincipal),
        `VOICE::${dur}::Voice message`,
      );
      await loadMessages();
    } catch {}
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !backend) return;
    // Send a placeholder text message indicating media was shared
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      await backend.sendMessage(
        Principal.fromText(otherPrincipal),
        `MEDIA::${mediaType}::${file.name}`,
      );
      await loadMessages();
    } catch {}
  };

  const scrollToPinned = () => {
    if (pinnedMessages.length === 0) return;
    const msgId = pinnedMessages[0].id;
    const el = document.querySelector(`[data-msg-id="${msgId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowPinnedBanner(false);
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : messages;

  const groupedMessages = filteredMessages.reduce(
    (groups: { date: string; msgs: ChatMessage[] }[], msg) => {
      const d = new Date(Number(msg.createdAt) / 1_000_000);
      const dateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.msgs.push(msg);
      } else {
        groups.push({ date: dateStr, msgs: [msg] });
      }
      return groups;
    },
    [],
  );

  const closeOverlays = () => {
    setReactionTarget(null);
    setContextMenu(null);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "oklch(0.09 0.010 15)" }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      data-ocid="chat.panel"
      onClick={closeOverlays}
      onKeyDown={closeOverlays}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 shrink-0 border-b"
        style={{
          borderColor: "oklch(0.20 0.015 15)",
          background: "oklch(0.12 0.015 15)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          data-ocid="chat.back.button"
          aria-label="Back"
        >
          <X size={20} style={{ color: "oklch(0.80 0.010 60)" }} />
        </button>
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
            style={{ border: "2px solid oklch(0.65 0.22 10)" }}
          />
          {onlineStatus && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                background: "oklch(0.72 0.20 145)",
                borderColor: "oklch(0.12 0.015 15)",
              }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm truncate"
            style={{ color: "oklch(0.96 0.008 60)" }}
          >
            @{username}
          </p>
          <p
            className="text-[11px]"
            style={{
              color: onlineStatus
                ? "oklch(0.72 0.20 145)"
                : "oklch(0.55 0.010 15)",
            }}
          >
            {onlineStatus ? "Online" : "Last seen recently"}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch((v) => !v);
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "oklch(0.20 0.015 15)" }}
          aria-label="Search"
          data-ocid="chat.search.button"
        >
          <Search size={16} style={{ color: "oklch(0.65 0.22 10)" }} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            callContext.startCall(otherPrincipal, username, avatarUrl, "voice");
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "oklch(0.20 0.015 15)" }}
          aria-label="Voice call"
          data-ocid="chat.voice_call.button"
        >
          <Phone size={16} style={{ color: "oklch(0.65 0.22 10)" }} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            callContext.startCall(otherPrincipal, username, avatarUrl, "video");
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "oklch(0.20 0.015 15)" }}
          aria-label="Video call"
          data-ocid="chat.video_call.button"
        >
          <Video size={16} style={{ color: "oklch(0.65 0.22 10)" }} />
        </button>
      </header>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 px-4 py-2 border-b"
            style={{
              borderColor: "oklch(0.20 0.015 15)",
              background: "oklch(0.12 0.015 15)",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: "oklch(0.18 0.015 15)" }}
            >
              <Search size={14} style={{ color: "oklch(0.55 0.010 15)" }} />
              <input
                type="search"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "oklch(0.94 0.008 60)" }}
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-ocid="chat.search_input"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}>
                  <X size={14} style={{ color: "oklch(0.55 0.010 15)" }} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned banner */}
      {pinnedMessages.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPinnedBanner(true);
            scrollToPinned();
          }}
          className="shrink-0 flex items-center gap-2 px-4 py-2 text-left border-b"
          style={{
            borderColor: "oklch(0.20 0.015 15)",
            background: "oklch(0.14 0.020 10 / 0.8)",
          }}
        >
          <Pin size={13} style={{ color: "oklch(0.78 0.14 75)" }} />
          <p
            className="text-xs flex-1 truncate"
            style={{ color: "oklch(0.78 0.14 75)" }}
          >
            📌 {pinnedMessages.length} pinned{" "}
            {pinnedMessages.length === 1 ? "message" : "messages"}
          </p>
        </button>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5"
        data-ocid="chat.list"
        onClick={closeOverlays}
        onKeyDown={closeOverlays}
        role="presentation"
      >
        {messages.length === 0 && !searchQuery && (
          <div className="text-center py-16 px-6" data-ocid="chat.empty_state">
            <div className="text-5xl mb-3">💌</div>
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: "oklch(0.94 0.008 60)" }}
            >
              Start a conversation
            </p>
            <p className="text-sm" style={{ color: "oklch(0.55 0.010 15)" }}>
              Say hello to @{username}
            </p>
            <div className="flex gap-2 justify-center mt-5 flex-wrap">
              {["👋", "❤️", "🔥", "😍", "💬", "🎉"].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={async () => {
                    if (!backend) return;
                    const { Principal } = await import(
                      "@icp-sdk/core/principal"
                    );
                    await backend
                      .sendMessage(Principal.fromText(otherPrincipal), e)
                      .catch(() => {});
                    await loadMessages();
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl active:scale-90 transition-transform"
                  style={{ background: "oklch(0.20 0.018 15)" }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {groupedMessages.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4 px-2">
              <div
                className="flex-1 h-px"
                style={{ background: "oklch(0.20 0.015 15)" }}
              />
              <span
                className="text-[10px] font-semibold px-3 py-1 rounded-full"
                style={{
                  color: "oklch(0.60 0.010 15)",
                  background: "oklch(0.16 0.015 15)",
                }}
              >
                {date}
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "oklch(0.20 0.015 15)" }}
              />
            </div>

            {msgs.map((msg, i) => {
              const isVoice = msg.text.startsWith("VOICE::");
              const isMedia = msg.text.startsWith("MEDIA::");
              let displayText = msg.text;
              let voiceDur = 0;
              if (isVoice) {
                const parts = msg.text.split("::");
                voiceDur = Number(parts[1]) || 0;
                displayText = "Voice message";
              }
              if (isMedia) {
                const parts = msg.text.split("::");
                displayText = `📎 ${parts[2] || "File"}`;
              }

              return (
                <div
                  key={msg.id}
                  className={`flex mb-1.5 px-2 ${msg.isMe ? "justify-end" : "justify-start"}`}
                  data-msg-id={msg.id}
                  data-ocid={`chat.item.${i + 1}`}
                >
                  {!msg.isMe && (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover self-end mr-1.5 shrink-0 mb-1"
                    />
                  )}
                  <div className="max-w-[75%] flex flex-col">
                    {/* Forwarded label */}
                    {msg.isForwarded && (
                      <div className="flex items-center gap-1 mb-0.5 px-1">
                        <Forward
                          size={11}
                          style={{ color: "oklch(0.60 0.010 15)" }}
                        />
                        <span
                          className="text-[10px]"
                          style={{ color: "oklch(0.60 0.010 15)" }}
                        >
                          Forwarded
                        </span>
                      </div>
                    )}

                    {/* Reaction picker */}
                    <AnimatePresence>
                      {reactionTarget === msg.id && (
                        <motion.div
                          className={`flex ${msg.isMe ? "justify-end" : "justify-start"} mb-1`}
                          initial={{ opacity: 0, scale: 0.8, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <div
                            className="flex gap-0.5 px-2 py-1.5 rounded-full shadow-xl overflow-x-auto max-w-xs"
                            style={{
                              background: "oklch(0.20 0.018 15)",
                              border: "1px solid oklch(0.28 0.020 15)",
                            }}
                          >
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="text-lg w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-transform shrink-0"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bubble */}
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3) }}
                      className={`px-4 py-2.5 text-sm text-left transition-opacity ${msg.isMe ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"} ${msg.isDeleted ? "opacity-50" : ""}`}
                      style={{
                        background: msg.isMe
                          ? "linear-gradient(135deg, oklch(0.65 0.22 10), oklch(0.55 0.20 340))"
                          : "oklch(0.18 0.018 15)",
                        border: msg.isMe
                          ? "none"
                          : "1px solid oklch(0.25 0.025 15)",
                        color: msg.isMe
                          ? "oklch(0.98 0 0)"
                          : "oklch(0.94 0.008 60)",
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleLongPressStart(msg.id, msg.isMe, e);
                        setReactionTarget(null);
                      }}
                      onTouchEnd={handleLongPressEnd}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLongPressStart(msg.id, msg.isMe, e);
                        setReactionTarget(null);
                      }}
                      onMouseUp={handleLongPressEnd}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setReactionTarget(msg.id);
                      }}
                    >
                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div
                          className="mb-2 px-2 py-1 rounded-lg border-l-2 text-xs"
                          style={{
                            borderColor: msg.isMe
                              ? "oklch(0.98 0 0 / 0.5)"
                              : "oklch(0.65 0.22 10)",
                            background: msg.isMe
                              ? "oklch(0.98 0 0 / 0.12)"
                              : "oklch(0.25 0.020 15)",
                          }}
                        >
                          <p
                            className="truncate"
                            style={{
                              color: msg.isMe
                                ? "oklch(0.90 0.010 15)"
                                : "oklch(0.65 0.22 10)",
                            }}
                          >
                            ↩ {msg.replyTo.text}
                          </p>
                        </div>
                      )}

                      {/* Content */}
                      {msg.isDeleted ? (
                        <p
                          className="italic"
                          style={{
                            color: msg.isMe
                              ? "oklch(0.85 0.05 10)"
                              : "oklch(0.55 0.010 15)",
                          }}
                        >
                          🚫 This message was deleted
                        </p>
                      ) : isVoice ? (
                        <VoiceWaveform duration={voiceDur} isMe={msg.isMe} />
                      ) : (
                        <p className="leading-relaxed">{displayText}</p>
                      )}

                      {/* Footer */}
                      <div
                        className={`flex items-center gap-1.5 mt-1 ${msg.isMe ? "justify-end" : "justify-start"}`}
                      >
                        {msg.isEdited && (
                          <span
                            className="text-[9px]"
                            style={{
                              color: msg.isMe
                                ? "oklch(0.85 0.05 10)"
                                : "oklch(0.55 0.010 15)",
                            }}
                          >
                            edited
                          </span>
                        )}
                        <span
                          className="text-[9px]"
                          style={{
                            color: msg.isMe
                              ? "oklch(0.85 0.05 10)"
                              : "oklch(0.55 0.010 15)",
                          }}
                        >
                          {timeAgo(Number(msg.createdAt) / 1_000_000)}
                        </span>
                        {msg.isMe && (
                          <CheckCheck
                            size={11}
                            style={{ color: "oklch(0.55 0.18 240)" }}
                          />
                        )}
                      </div>
                    </motion.button>

                    {/* Reaction badge */}
                    {msg.reaction && (
                      <div
                        className={`mt-0.5 text-sm px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${msg.isMe ? "ml-auto" : ""}`}
                        style={{
                          background: "oklch(0.20 0.018 15)",
                          border: "1px solid oklch(0.28 0.020 15)",
                        }}
                      >
                        <span>{msg.reaction}</span>
                        <span
                          className="text-[10px]"
                          style={{ color: "oklch(0.60 0.010 15)" }}
                        >
                          1
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Read receipt for last sent */}
        <ReadReceipt
          isMe={messages[messages.length - 1]?.isMe ?? false}
          isLast={!!messages.length}
        />

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="fixed z-[60] rounded-2xl shadow-2xl overflow-hidden min-w-[180px]"
            style={{
              background: "oklch(0.17 0.018 15)",
              border: "1px solid oklch(0.28 0.020 15)",
              top: Math.min(contextMenu.y, window.innerHeight - 280),
              left: Math.min(
                Math.max(contextMenu.x - 80, 8),
                window.innerWidth - 200,
              ),
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="menu"
          >
            {[
              {
                icon: "↩",
                label: "Reply",
                action: () => {
                  const msg = messages.find(
                    (m) => m.id === contextMenu.messageId,
                  );
                  if (msg) {
                    setReplyTo({ id: msg.id, text: msg.text });
                  }
                  setContextMenu(null);
                },
              },
              {
                icon: <Forward size={14} />,
                label: "Forward",
                action: () => {
                  const msg = messages.find(
                    (m) => m.id === contextMenu.messageId,
                  );
                  if (msg) handleForward(msg);
                },
              },
              {
                icon: <Pin size={14} />,
                label: "Pin",
                action: () => handlePin(contextMenu.messageId),
              },
              ...(contextMenu.isMe
                ? [
                    {
                      icon: <Edit2 size={14} />,
                      label: "Edit",
                      action: () => {
                        const msg = messages.find(
                          (m) => m.id === contextMenu.messageId,
                        );
                        if (msg) handleEdit(msg);
                      },
                    },
                    {
                      icon: (
                        <Trash2
                          size={14}
                          style={{ color: "oklch(0.65 0.22 10)" }}
                        />
                      ),
                      label: "Delete for everyone",
                      action: () =>
                        handleDeleteForEveryone(contextMenu.messageId),
                      danger: true,
                    },
                  ]
                : []),
              {
                icon: (
                  <Trash2 size={14} style={{ color: "oklch(0.65 0.22 10)" }} />
                ),
                label: "Delete for me",
                action: () => handleDeleteForMe(contextMenu.messageId),
                danger: true,
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left active:opacity-70 transition-opacity border-b last:border-0"
                style={{
                  borderColor: "oklch(0.22 0.015 15)",
                  color: (item as { danger?: boolean }).danger
                    ? "oklch(0.65 0.22 10)"
                    : "oklch(0.92 0.008 60)",
                }}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 flex items-center gap-3 px-4 py-2 border-t"
            style={{
              borderColor: "oklch(0.20 0.015 15)",
              background: "oklch(0.14 0.020 10 / 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="note"
          >
            <div
              className="flex-1 min-w-0 border-l-2 pl-2"
              style={{ borderColor: "oklch(0.65 0.22 10)" }}
            >
              <p
                className="text-xs font-semibold mb-0.5"
                style={{ color: "oklch(0.65 0.22 10)" }}
              >
                Reply
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.70 0.010 15)" }}
              >
                {replyTo.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.22 0.015 15)" }}
            >
              <X size={14} style={{ color: "oklch(0.70 0.010 15)" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit bar */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 flex items-center gap-3 px-4 py-2 border-t"
            style={{
              borderColor: "oklch(0.20 0.015 15)",
              background: "oklch(0.14 0.020 10 / 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="note"
          >
            <Edit2 size={14} style={{ color: "oklch(0.78 0.14 75)" }} />
            <p
              className="text-xs flex-1"
              style={{ color: "oklch(0.78 0.14 75)" }}
            >
              Editing message
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setText("");
              }}
              aria-label="Cancel edit"
            >
              <X size={14} style={{ color: "oklch(0.70 0.010 15)" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice recording indicator */}
      <AnimatePresence>
        {isRecordingVoice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 flex items-center gap-3 px-4 py-2 border-t"
            style={{
              borderColor: "oklch(0.20 0.015 15)",
              background: "oklch(0.18 0.025 10 / 0.9)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
            >
              <Mic size={16} style={{ color: "oklch(0.65 0.22 10)" }} />
            </motion.div>
            <p
              className="text-sm flex-1 font-medium"
              style={{ color: "oklch(0.65 0.22 10)" }}
            >
              Recording... {voiceSeconds}s
            </p>
            <p className="text-xs" style={{ color: "oklch(0.60 0.010 15)" }}>
              Release to send
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="shrink-0 px-3 py-3 flex items-center gap-2 border-t"
        style={{
          borderColor: "oklch(0.20 0.015 15)",
          background: "oklch(0.12 0.015 15)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setShowQuickEmoji((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: "oklch(0.20 0.015 15)" }}
          aria-label="Emoji"
          data-ocid="chat.emoji.button"
        >
          <Smile size={18} style={{ color: "oklch(0.78 0.14 75)" }} />
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            className="w-full rounded-full px-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: "oklch(0.17 0.015 15)",
              border: "1.5px solid oklch(0.26 0.020 15)",
              color: "oklch(0.94 0.008 60)",
            }}
            placeholder={
              editingId
                ? "Edit message..."
                : replyTo
                  ? "Type a reply..."
                  : "Message..."
            }
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            data-ocid="chat.input"
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "oklch(0.65 0.22 10)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "oklch(0.26 0.020 15)";
            }}
          />
        </div>

        {text.trim() ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 10), oklch(0.55 0.20 340))",
            }}
            data-ocid="chat.send.button"
            aria-label="Send"
          >
            <Send size={16} style={{ color: "oklch(0.98 0 0)" }} />
          </button>
        ) : (
          <div className="flex gap-1.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "oklch(0.20 0.015 15)" }}
              aria-label="Attach file"
              data-ocid="chat.attach.button"
            >
              <Paperclip size={16} style={{ color: "oklch(0.65 0.22 10)" }} />
            </button>
            <button
              type="button"
              onMouseDown={startVoiceRecord}
              onMouseUp={stopVoiceRecord}
              onTouchStart={startVoiceRecord}
              onTouchEnd={stopVoiceRecord}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: isRecordingVoice
                  ? "oklch(0.65 0.22 10)"
                  : "oklch(0.20 0.015 15)",
              }}
              aria-label="Voice message"
              data-ocid="chat.mic.button"
            >
              <Mic
                size={16}
                style={{
                  color: isRecordingVoice
                    ? "oklch(0.98 0 0)"
                    : "oklch(0.65 0.22 10)",
                }}
              />
            </button>
          </div>
        )}
      </div>

      {/* Quick emoji bar */}
      <AnimatePresence>
        {showQuickEmoji && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 flex gap-1.5 px-4 pb-3 pt-1 overflow-x-auto"
            style={{ background: "oklch(0.12 0.015 15)" }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {[
              "❤️",
              "😍",
              "👍",
              "🔥",
              "🎉",
              "🤣",
              "😮",
              "😢",
              "😡",
              "💯",
              "🙌",
              "😭",
            ].map((e) => (
              <button
                key={e}
                type="button"
                onClick={async () => {
                  if (!backend) return;
                  const { Principal } = await import("@icp-sdk/core/principal");
                  await backend
                    .sendMessage(Principal.fromText(otherPrincipal), e)
                    .catch(() => {});
                  await loadMessages();
                  setShowQuickEmoji(false);
                }}
                className="text-2xl w-10 h-10 shrink-0 flex items-center justify-center rounded-full active:scale-90 transition-transform"
                style={{ background: "oklch(0.20 0.015 15)" }}
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward user picker modal */}
      <AnimatePresence>
        {forwardMsg && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end"
            style={{ background: "oklch(0 0 0 / 0.7)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setForwardMsg(null)}
            onKeyDown={() => setForwardMsg(null)}
          >
            <motion.div
              className="w-full rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto"
              style={{
                background: "oklch(0.15 0.015 15)",
                border: "1px solid oklch(0.22 0.015 15)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <h3
                className="font-bold text-base mb-4 text-center"
                style={{ color: "oklch(0.94 0.008 60)" }}
              >
                Forward to...
              </h3>
              {allUsers.map((u) => (
                <button
                  key={u.principal}
                  type="button"
                  onClick={() => doForward(u.principal)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl active:scale-98 transition-transform"
                  style={{
                    background: "oklch(0.20 0.018 15)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className="font-semibold text-sm"
                    style={{ color: "oklch(0.94 0.008 60)" }}
                  >
                    @{u.username}
                  </span>
                </button>
              ))}
              {allUsers.length === 0 && (
                <p
                  className="text-center py-8 text-sm"
                  style={{ color: "oklch(0.55 0.010 15)" }}
                >
                  No conversations to forward to
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
