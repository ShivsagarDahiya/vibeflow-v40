import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BellDot,
  MessageCircle,
  CheckCheck,
  UserPlus,
  X,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useConversations } from "@/hooks/useChat";
import { useNotifications } from "@/hooks/useNotifications";
import type { Conversation } from "@/types/chat";
import type { AppNotification, NotificationType } from "@/types/chat";

// ── helpers ──────────────────────────────────────────────────────────────────

function timeLabel(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = new Date(iso);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

const ACCENT: Record<NotificationType, string> = {
  like: "#e91e63",
  comment: "#06b6d4",
  follow: "#3b82f6",
  match: "#f4a460",
  follow_request: "#3b82f6",
  mention: "#8b5cf6",
  duet: "#10b981",
};

// ── Conversation Row ──────────────────────────────────────────────────────────

function ConvRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(0);
  const [revealed, setRevealed] = useState<"none" | "left" | "right">("none");

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    setSwipeX(Math.max(-88, Math.min(0, dx)));
  };
  const onTouchEnd = () => {
    if (swipeX < -44) setRevealed("right");
    else setRevealed("none");
    setSwipeX(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe actions */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        <button
          type="button"
          aria-label={conv.isMuted ? "Unmute" : "Mute"}
          className="w-20 bg-[#3b82f6]/80 flex items-center justify-center text-white text-xs font-medium"
          onClick={() => setRevealed("none")}
        >
          {conv.isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          aria-label="Archive conversation"
          className="w-20 bg-[#e91e63]/80 flex items-center justify-center text-white text-xs font-medium"
          onClick={() => setRevealed("none")}
        >
          Archive
        </button>
      </div>

      <motion.div
        animate={{ x: revealed === "right" ? -88 : swipeX }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative bg-[#120810] flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-white/5"
        onClick={onPress}
        data-ocid="conv-row"
      >
        {/* Avatar + online dot */}
        <div className="relative flex-shrink-0">
          {conv.isPinned && (
            <div className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#f4a460] flex items-center justify-center z-10">
              <span className="text-[8px]">📌</span>
            </div>
          )}
          <img
            src={conv.participantAvatar}
            alt={conv.participantName}
            className="w-12 h-12 rounded-full object-cover"
            style={
              conv.unreadCount > 0
                ? { border: "2px solid #e91e63" }
                : { border: "2px solid transparent" }
            }
          />
          {conv.participantIsOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120810]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm truncate ${conv.unreadCount > 0 ? "text-white font-semibold" : "text-white/80 font-medium"}`}
            >
              {conv.participantName}
            </span>
            <span className="text-white/40 text-xs flex-shrink-0">{timeLabel(conv.lastMessageAt)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-white/50 text-xs truncate flex-1">
              {conv.isTyping ? (
                <span className="text-[#e91e63] text-xs italic">typing…</span>
              ) : (
                conv.lastMessage
              )}
            </p>
            {conv.unreadCount > 0 && (
              <span className="bg-[#e91e63] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
            {conv.isMuted && !conv.unreadCount && (
              <span className="text-white/30">🔕</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Notification Card ─────────────────────────────────────────────────────────

function NotifCard({
  notif,
  onAction,
}: {
  notif: AppNotification;
  onAction: (id: string, action: "accepted" | "declined" | "followed_back") => void;
}) {
  const accent = ACCENT[notif.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 ${notif.isRead ? "opacity-70" : ""}`}
      data-ocid="notif-card"
    >
      {/* Type accent bar */}
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: accent }} />

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={notif.actorAvatar}
          alt={notif.actorName}
          className="w-11 h-11 rounded-full object-cover"
          style={{ border: `2px solid ${accent}40` }}
        />
        <span
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: accent }}
        >
          {notif.type === "like" ? "❤️" : notif.type === "comment" ? "💬" : notif.type === "follow" || notif.type === "follow_request" ? "👤" : notif.type === "match" ? "💘" : notif.type === "mention" ? "@" : "🎵"}
        </span>
      </div>

      {/* Text + actions */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-tight">
          <span className="font-semibold">{notif.actorName}</span>{" "}
          <span className="text-white/70">{notif.text}</span>
        </p>
        <p className="text-white/40 text-xs mt-0.5">{timeLabel(notif.createdAt)}</p>

        {/* Inline actions */}
        {notif.requiresAction && !notif.actionTaken && (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => onAction(notif.id, "accepted")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#e91e63,#c2185b)" }}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onAction(notif.id, "declined")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white/70 bg-white/10"
            >
              Decline
            </button>
          </div>
        )}
        {notif.actionTaken && (
          <span className="text-white/40 text-xs italic mt-1 inline-block">
            {notif.actionTaken === "accepted" ? "Accepted" : notif.actionTaken === "declined" ? "Declined" : "Following"}
          </span>
        )}
        {notif.type === "follow" && !notif.actionTaken && (
          <button
            type="button"
            onClick={() => onAction(notif.id, "followed_back")}
            className="mt-1.5 px-4 py-1 rounded-full text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
          >
            Follow Back
          </button>
        )}
      </div>

      {/* Entity thumbnail */}
      {notif.entityThumbnail && (
        <img
          src={notif.entityThumbnail}
          alt="Post"
          className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
        />
      )}
    </motion.div>
  );
}

function NotifSection({ label, items, onAction }: {
  label: string;
  items: AppNotification[];
  onAction: (id: string, action: "accepted" | "declined" | "followed_back") => void;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-4 py-2">{label}</p>
      {items.map((n) => <NotifCard key={n.id} notif={n} onAction={onAction} />)}
    </div>
  );
}

// ── InboxPage ─────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"messages" | "notifications">("messages");
  const [search, setSearch] = useState("");

  const { conversations, loading: convLoading } = useConversations();
  const { followRequests, grouped, unreadCount, loading: notifLoading, markAllRead, handleAction } =
    useNotifications();

  const filteredConvs = useCallback(() => {
    const pinned = conversations.filter((c) => c.isPinned && !c.isArchived);
    const rest = conversations.filter((c) => !c.isPinned && !c.isArchived);
    const all = [...pinned, ...rest];
    if (!search) return all;
    return all.filter((c) => c.participantName.toLowerCase().includes(search.toLowerCase()));
  }, [conversations, search]);

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: "#0d0610" }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-14 pb-0"
        style={{ background: "linear-gradient(180deg,#1a0a14 0%,#0d0610 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-white text-2xl font-bold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Inbox
          </h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="bg-[#e91e63] text-white text-xs font-bold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
            <button
              type="button"
              aria-label="New message"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(["messages", "notifications"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors capitalize flex items-center justify-center gap-2 ${tab === t ? "text-[#e91e63] border-b-2 border-[#e91e63]" : "text-white/40"}`}
              data-ocid={`inbox-tab-${t}`}
            >
              {t === "messages" ? <MessageCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {t}
              {t === "notifications" && unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#e91e63]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {tab === "messages" ? (
            <motion.div
              key="messages"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 bg-white/8 rounded-full px-4 py-2.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                    data-ocid="conv-search"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              {convLoading ? (
                <div className="space-y-1 px-4">
                  {[...Array(6)].map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={`conv-skel-${i}`} className="flex items-center gap-3 py-3">
                      <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
                        <div className="h-2 bg-white/10 rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Pinned section */}
                  {filteredConvs().some((c) => c.isPinned) && (
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-4 py-2">
                      Pinned
                    </p>
                  )}
                  {filteredConvs().map((conv) => (
                    <ConvRow
                      key={conv.id}
                      conv={conv}
                      onPress={() => navigate(`/chat/${conv.id}`)}
                    />
                  ))}
                  {filteredConvs().length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3" data-ocid="empty-conversations">
                      <MessageCircle className="w-12 h-12 text-white/20" />
                      <p className="text-white/40 text-sm">No conversations yet</p>
                      <p className="text-white/20 text-xs">Match with someone to start chatting</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Mark all read */}
              {unreadCount > 0 && (
                <div className="flex justify-end px-4 py-2">
                  <button
                    type="button"
                    onClick={() => { void markAllRead(); }}
                    className="flex items-center gap-1.5 text-[#e91e63] text-xs font-medium"
                    data-ocid="mark-all-read"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                </div>
              )}

              {notifLoading ? (
                <div className="space-y-1 px-4">
                  {[...Array(5)].map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={`notif-skel-${i}`} className="flex items-center gap-3 py-3">
                      <div className="w-1 h-10 bg-white/10 rounded-full animate-pulse" />
                      <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                        <div className="h-2 bg-white/10 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Follow requests */}
                  {followRequests.length > 0 && (
                    <div className="mx-4 my-3 rounded-2xl overflow-hidden" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-[#3b82f6]" />
                          <span className="text-white font-semibold text-sm">Follow Requests</span>
                          <span className="bg-[#3b82f6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {followRequests.length}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      </div>
                      {followRequests.map((n) => (
                        <NotifCard key={n.id} notif={n} onAction={handleAction} />
                      ))}
                    </div>
                  )}

                  <NotifSection label="Today" items={grouped.today} onAction={handleAction} />
                  <NotifSection label="Yesterday" items={grouped.yesterday} onAction={handleAction} />
                  <NotifSection label="Earlier" items={grouped.earlier} onAction={handleAction} />

                  {!grouped.today.length && !grouped.yesterday.length && !grouped.earlier.length && !followRequests.length && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3" data-ocid="empty-notifications">
                      <BellDot className="w-12 h-12 text-white/20" />
                      <p className="text-white/40 text-sm">No notifications yet</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
