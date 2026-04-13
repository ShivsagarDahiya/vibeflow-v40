import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Send, ChevronDown } from "lucide-react";

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommentsDrawerProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCount?: number;
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: "c1",
    userId: "u2",
    username: "aria.flows",
    avatarUrl: "https://i.pravatar.cc/40?img=47",
    text: "This is absolutely stunning! 🔥🔥🔥",
    likes: 234,
    isLiked: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    replies: [
      {
        id: "c1r1",
        userId: "u3",
        username: "luna.creates",
        avatarUrl: "https://i.pravatar.cc/40?img=9",
        text: "Agreed!! The lighting is everything ✨",
        likes: 45,
        isLiked: false,
        createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
      },
    ],
  },
  {
    id: "c2",
    userId: "u4",
    username: "marco.vibes",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    text: "The vibe is immaculate 💎",
    likes: 89,
    isLiked: true,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: "c3",
    userId: "u5",
    username: "zara.bloom",
    avatarUrl: "https://i.pravatar.cc/40?img=25",
    text: "I could watch this on loop forever 🎵✨",
    likes: 156,
    isLiked: false,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "c4",
    userId: "u6",
    username: "kai.rivers",
    avatarUrl: "https://i.pravatar.cc/40?img=33",
    text: "Collab please?? 🙏",
    likes: 67,
    isLiked: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function CommentRow({
  comment,
  onLike,
  depth = 0,
}: {
  comment: Comment;
  onLike: (id: string) => void;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(false);
  return (
    <div className={depth > 0 ? "ml-10" : ""}>
      <div className="flex gap-3 py-3">
        <img
          src={comment.avatarUrl}
          alt={comment.username}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="text-white font-semibold text-sm mr-2">{comment.username}</span>
              <span className="text-white/80 text-sm">{comment.text}</span>
            </div>
            <button
              type="button"
              onClick={() => onLike(comment.id)}
              aria-label={comment.isLiked ? "Unlike" : "Like comment"}
              className="flex flex-col items-center gap-0.5 flex-shrink-0"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${comment.isLiked ? "fill-[#e91e63] text-[#e91e63]" : "text-white/40"}`}
              />
              <span className="text-white/40 text-[10px]">{comment.likes}</span>
            </button>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-white/40 text-xs">{timeAgo(comment.createdAt)}</span>
            {(comment.replies?.length ?? 0) > 0 && depth === 0 && (
              <button
                type="button"
                onClick={() => setShowReplies((p) => !p)}
                className="text-white/50 text-xs flex items-center gap-1"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showReplies ? "rotate-180" : ""}`}
                />
                {showReplies ? "Hide" : `${comment.replies?.length} replies`}
              </button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showReplies && comment.replies && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {comment.replies.map((r) => (
              <CommentRow key={r.id} comment={r} onLike={onLike} depth={1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CommentsDrawer({ videoId, isOpen, onClose, initialCount = 0 }: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`);
      if (res.ok) {
        const data: Comment[] = await res.json();
        setComments(data);
      } else {
        setComments(SAMPLE_COMMENTS);
      }
    } catch {
      setComments(SAMPLE_COMMENTS);
    }
  }, [videoId]);

  useEffect(() => {
    if (isOpen) fetchComments();
  }, [isOpen, fetchComments]);

  const handleLike = useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    const optimistic: Comment = {
      id: `tmp-${Date.now()}`,
      userId: "me",
      username: "you",
      avatarUrl: "https://i.pravatar.cc/40?img=1",
      text: text.trim(),
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setText("");
    try {
      await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
    } catch {
      // ignore
    }
  }, [text, videoId]);

  const total = comments.length + (initialCount > comments.length ? initialCount - comments.length : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[91] rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: "#1a0a14", maxHeight: "75vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="w-8" />
              <h2 className="text-white font-semibold text-base">{total} comments</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close comments"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 overscroll-contain">
              {comments.map((c) => (
                <CommentRow key={c.id} comment={c} onLike={handleLike} />
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3 safe-bottom">
              <img
                src="https://i.pravatar.cc/40?img=1"
                alt="You"
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex items-center bg-white/10 rounded-full px-4 py-2 gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { void handleSubmit(); } }}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none min-w-0"
                  data-ocid="comment-input"
                />
                {text.trim() && (
                  <button
                    type="button"
                    onClick={() => { void handleSubmit(); }}
                    aria-label="Send comment"
                    className="text-[#e91e63] flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
