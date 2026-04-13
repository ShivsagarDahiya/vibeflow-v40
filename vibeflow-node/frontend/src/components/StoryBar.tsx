import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStories } from "../hooks/useStories";
import type { StoryGroup } from "../types/feed";

interface StoryBarProps {
  onAddStory: () => void;
  onViewStory: (group: StoryGroup, index: number) => void;
}

function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
      <div className="w-12 h-2 rounded-full bg-white/10 animate-pulse" />
    </div>
  );
}

export function StoryBar({ onAddStory, onViewStory }: StoryBarProps) {
  const { data: groups, isLoading } = useStories();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none"
      style={{ WebkitOverflowScrolling: "touch" }}
      data-ocid="story-bar"
    >
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => <StorySkeleton key={i} />)
        : groups?.map((group) =>
            group.isOwn ? (
              <OwnStoryCircle key="own" group={group} onAdd={onAddStory} />
            ) : (
              <StoryCircle
                key={group.userId}
                group={group}
                onClick={() => onViewStory(group, 0)}
              />
            )
          )}
    </div>
  );
}

function OwnStoryCircle({
  group,
  onAdd,
}: {
  group: StoryGroup;
  onAdd: () => void;
}) {
  return (
    <motion.button
      type="button"
      className="flex flex-col items-center gap-1 flex-shrink-0"
      whileTap={{ scale: 0.92 }}
      onClick={onAdd}
      data-ocid="story-add-btn"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
          <img
            src={group.avatarUrl}
            alt="Your story"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#e91e63] flex items-center justify-center border-2 border-[#0d0208]">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <title>Add story</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
      <span className="text-[10px] text-white/70 font-medium w-16 text-center truncate">
        Your Story
      </span>
    </motion.button>
  );
}

function StoryCircle({
  group,
  onClick,
}: {
  group: StoryGroup;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className="flex flex-col items-center gap-1 flex-shrink-0"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      data-ocid="story-circle"
    >
      <div className="relative">
        {/* Gradient ring for unviewed */}
        <div
          className={`w-[68px] h-[68px] rounded-full flex items-center justify-center p-[2.5px] ${
            group.hasUnviewed
              ? ""
              : "bg-white/20"
          }`}
          style={
            group.hasUnviewed
              ? {
                  background:
                    "linear-gradient(135deg, #e91e63 0%, #f4a460 50%, #e91e63 100%)",
                }
              : undefined
          }
        >
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#0d0208]">
            <img
              src={group.avatarUrl}
              alt={group.username}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {group.stories.length > 1 && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e91e63] flex items-center justify-center border border-[#0d0208]">
            <span className="text-[8px] text-white font-bold">{group.stories.length}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-white/70 font-medium w-16 text-center truncate">
        {group.username}
      </span>
    </motion.button>
  );
}

// Re-export for use in StoryViewer context
export type { StoryBarProps };
