import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayer } from "./VideoPlayer";
import { VideoOptionsSheet } from "./VideoOptionsSheet";
import type { VideoItem, Reaction } from "../types/feed";

interface VideoCardProps {
  video: VideoItem;
  isActive: boolean;
  onLike: (videoId: string, isLiked: boolean) => void;
  onBookmark: (videoId: string) => void;
  onFollow: (userId: string) => void;
  onOpenComments: (videoId: string) => void;
}

const REACTIONS: Reaction[] = ["❤️", "😂", "😮", "😢", "😡", "🔥", "🎉"];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function VideoCard({
  video,
  isActive,
  onLike,
  onBookmark,
  onFollow,
  onOpenComments,
}: VideoCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionBar(true);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleReact = useCallback((emoji: Reaction) => {
    setLastReaction(emoji);
    setShowReactionBar(false);
    if (emoji === "❤️") {
      onLike(video.id, !video.isLiked);
    }
  }, [video.id, video.isLiked, onLike]);

  const handleLike = useCallback(() => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    onLike(video.id, !video.isLiked);
  }, [video.id, video.isLiked, onLike]);

  return (
    <div
      className="relative w-full h-full"
      onPointerDown={handleLongPressStart}
      onPointerUp={handleLongPressEnd}
      onPointerLeave={handleLongPressEnd}
      data-ocid="video-card"
    >
      {/* Video Player */}
      <VideoPlayer
        videoUrl={video.videoUrl}
        thumbnailUrl={video.thumbnailUrl}
        isActive={isActive}
        quality={video.quality}
        duration={video.duration}
      />

      {/* 3-dot menu — top right */}
      <button
        type="button"
        className="absolute top-14 right-3 z-20 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        onClick={() => setShowOptions(true)}
        aria-label="Video options"
        data-ocid="video-options-btn"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <title>Options</title>
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
        {/* Creator avatar */}
        <div className="relative">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white">
            <img
              src={video.creator.avatarUrl}
              alt={video.creator.username}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#e91e63] flex items-center justify-center border-2 border-black"
            onClick={() => onFollow(video.creator.id)}
            aria-label={`Follow ${video.creator.username}`}
            data-ocid="follow-btn"
          >
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Follow</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            type="button"
            className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center"
            onClick={handleLike}
            whileTap={{ scale: 0.8 }}
            aria-label={video.isLiked ? "Unlike" : "Like"}
            data-ocid="like-btn"
          >
            <motion.svg
              className="w-7 h-7"
              fill={video.isLiked ? "#e91e63" : "none"}
              stroke={video.isLiked ? "#e91e63" : "white"}
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              animate={likeAnimating ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              aria-hidden="true"
            >
              <title>Like</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </motion.svg>
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(video.likes)}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center"
            onClick={() => onOpenComments(video.id)}
            aria-label="Comments"
            data-ocid="comments-btn"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <title>Comments</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(video.comments)}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center"
            onClick={() => navigator.share?.({ title: video.caption, url: window.location.href })}
            aria-label="Share"
            data-ocid="share-btn"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <title>Share</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(video.shares)}</span>
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center"
            onClick={() => onBookmark(video.id)}
            aria-label={video.isBookmarked ? "Remove bookmark" : "Bookmark"}
            data-ocid="bookmark-btn"
          >
            <svg
              className="w-6 h-6"
              fill={video.isBookmarked ? "#f4a460" : "none"}
              stroke={video.isBookmarked ? "#f4a460" : "white"}
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Bookmark</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </button>
        </div>

        {/* Gift */}
        <button
          type="button"
          className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center"
          aria-label="Send gift"
          data-ocid="gift-btn"
        >
          <span className="text-xl">🎁</span>
        </button>

        {/* Spinning disc */}
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30">
          <img
            src={video.creator.avatarUrl}
            alt="Sound"
            className="w-full h-full object-cover animate-spin"
            style={{ animationDuration: "4s" }}
          />
        </div>
      </div>

      {/* Bottom left: creator info */}
      <div
        className="absolute bottom-20 left-3 right-20 z-20"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
          paddingTop: "40px",
          paddingBottom: "8px",
        }}
      >
        {/* Username + verified */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-white font-bold text-sm">@{video.creator.username}</span>
          {video.creator.isVerified && (
            <svg className="w-3.5 h-3.5 text-[#e91e63]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Verified</title>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Caption */}
        <button
          type="button"
          className="text-left"
          onClick={() => setIsCaptionExpanded((e) => !e)}
          data-ocid="caption-expand"
        >
          <p className={`text-white text-sm leading-snug ${isCaptionExpanded ? "" : "line-clamp-2"}`}>
            {video.caption}
          </p>
        </button>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {video.hashtags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[#e91e63] text-xs font-semibold">
              #{tag}
            </span>
          ))}
        </div>

        {/* Sound label */}
        <div className="flex items-center gap-1.5 mt-2">
          <svg className="w-3 h-3 text-white/70 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <title>Sound</title>
            <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
          </svg>
          <p className="text-white/70 text-xs truncate">
            {video.soundArtist} · {video.soundName}
          </p>
        </div>

        {/* Last reaction */}
        {lastReaction && (
          <motion.span
            className="text-base"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {lastReaction}
          </motion.span>
        )}
      </div>

      {/* Long-press reaction bar */}
      <AnimatePresence>
        {showReactionBar && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReactionBar(false)}
          >
            <motion.div
              className="flex gap-2 bg-black/80 rounded-full px-5 py-3 border border-white/10"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              {REACTIONS.map((emoji, i) => (
                <motion.button
                  type="button"
                  key={emoji}
                  className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => { e.stopPropagation(); handleReact(emoji); }}
                  data-ocid="reaction-emoji"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options sheet */}
      <VideoOptionsSheet
        videoId={video.id}
        creatorUsername={video.creator.username}
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        onReport={() => {}}
        onDownload={() => {}}
        onDuet={() => {}}
        onBlock={() => {}}
      />
    </div>
  );
}
