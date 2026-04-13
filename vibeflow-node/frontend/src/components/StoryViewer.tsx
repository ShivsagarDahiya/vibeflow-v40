import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useViewStory, useReactToStory, useVoteOnPoll } from "../hooks/useStories";
import type { StoryGroup, StoryItem, Reaction } from "../types/feed";

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const REACTIONS: Reaction[] = ["❤️", "😂", "😮", "😢", "😡", "🔥", "🎉"];
const STORY_DURATION = 5000;

export function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sentReaction, setSentReaction] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { mutate: viewStory } = useViewStory();
  const { mutate: reactToStory } = useReactToStory();
  const { mutate: votePoll } = useVoteOnPoll();

  const currentGroup = groups[groupIdx];
  const currentStory: StoryItem | undefined = currentGroup?.stories[storyIdx];

  const goNext = useCallback(() => {
    if (storyIdx < (currentGroup?.stories.length ?? 1) - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, currentGroup, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      setStoryIdx(0);
      setProgress(0);
    }
  }, [storyIdx, groupIdx]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (STORY_DURATION / 100);
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, goNext, storyIdx, groupIdx]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory) {
      viewStory({ storyId: currentStory.id });
    }
  }, [currentStory?.id, viewStory]);

  const handleReact = (emoji: Reaction) => {
    if (!currentStory) return;
    reactToStory({ storyId: currentStory.id, emoji });
    setSentReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setSentReaction(null), 2000);
  };

  const handleVote = (optionId: string) => {
    if (!currentStory) return;
    votePoll({ storyId: currentStory.id, optionId });
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Story content */}
      <div className="relative w-full h-full max-w-sm mx-auto">
        {/* Background image */}
        <img
          src={currentStory.mediaUrl}
          alt={currentStory.caption ?? "Story"}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 pt-safe">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header: avatar + name + close */}
        <div className="absolute top-8 left-0 right-0 flex items-center gap-2 px-4">
          <img
            src={currentGroup.avatarUrl}
            alt={currentGroup.username}
            className="w-8 h-8 rounded-full border border-white/50 object-cover"
          />
          <span className="text-white font-semibold text-sm">{currentGroup.username}</span>
          <span className="text-white/50 text-xs ml-1">
            {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            type="button"
            className="ml-auto text-white/80 hover:text-white"
            onClick={onClose}
            aria-label="Close story"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Close</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex" style={{ top: "60px", bottom: "120px" }}>
          <button
            type="button"
            className="flex-1"
            onClick={goPrev}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            aria-label="Previous story"
          />
          <button
            type="button"
            className="flex-1"
            onClick={goNext}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            aria-label="Next story"
          />
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute left-4 right-4 bottom-32">
            <p className="text-white text-sm font-medium drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}

        {/* Poll sticker */}
        {currentStory.hasPoll && currentStory.pollOptions && (
          <div className="absolute left-4 right-4 bottom-40 bg-black/60 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-3">{currentStory.pollQuestion}</p>
            <div className="flex gap-2">
              {currentStory.pollOptions.map((opt) => {
                const total = currentStory.pollOptions!.reduce((s, o) => s + o.votes, 0);
                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    className="flex-1 rounded-xl border-2 border-[#e91e63] p-2 text-white text-xs font-semibold relative overflow-hidden"
                    onClick={() => handleVote(opt.id)}
                    data-ocid="story-poll-vote"
                  >
                    <div
                      className="absolute inset-0 bg-[#e91e63]/20 rounded-xl transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative">{opt.text}</span>
                    <span className="relative block text-[#e91e63]">{pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reaction sent animation */}
        <AnimatePresence>
          {sentReaction && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-6xl">{sentReaction}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-safe">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Reply to story..."
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/40 text-sm backdrop-blur-sm"
              data-ocid="story-reply-input"
            />
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white"
              onClick={() => setShowReactions((s) => !s)}
              aria-label="React to story"
              data-ocid="story-react-btn"
            >
              ❤️
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white"
              aria-label="Share story"
              data-ocid="story-share-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <title>Share</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684a3 3 0 10-5.316 2.684 3 3 0 005.316-2.684zm-9.632-9.368a3 3 0 10-5.316 2.684 3 3 0 005.316-2.684z" />
              </svg>
            </button>
          </div>

          {/* Reaction bar */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                className="flex justify-center gap-2 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {REACTIONS.map((emoji) => (
                  <motion.button
                    type="button"
                    key={emoji}
                    className="text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleReact(emoji)}
                    data-ocid="story-reaction"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
