import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { VideoCard } from "../components/VideoCard";
import { StoryBar } from "../components/StoryBar";
import { StoryViewer } from "../components/StoryViewer";
import { StoryCreator } from "../components/StoryCreator";
import { VideoUploadModal } from "../components/VideoUploadModal";
import { MiniPlayer } from "../components/MiniPlayer";
import { useFeed, useLikeVideo, useBookmarkVideo } from "../hooks/useFeed";
import { useStories } from "../hooks/useStories";
import type { FeedTab, VideoItem, StoryGroup } from "../types/feed";

const TABS: { key: FeedTab; label: string }[] = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "trending", label: "Trending" },
  { key: "popular", label: "Popular" },
];

function VideoSkeleton() {
  return (
    <div className="w-full h-full bg-[#0d0208] flex flex-col snap-start snap-always flex-shrink-0">
      <div className="flex-1 animate-pulse" style={{ background: "linear-gradient(135deg, #1a0a12 0%, #0d0208 100%)" }}>
        <div className="absolute right-4 bottom-32 flex flex-col gap-5">
          {[48, 48, 48, 48].map((size, i) => (
            <div key={i} className={`w-${size/4} h-${size/4} rounded-full bg-white/10 animate-pulse`} style={{ width: size / 4 * 4, height: size / 4 * 4 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage({ isActive: pageIsActive = true }: { isActive?: boolean }) {
  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [storyViewerState, setStoryViewerState] = useState<{
    groups: StoryGroup[];
    initialIdx: number;
  } | null>(null);
  const [miniPlayerVideo, setMiniPlayerVideo] = useState<VideoItem | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useFeed(activeTab);

  const { data: storyGroups } = useStories();
  const { mutate: likeVideo } = useLikeVideo();
  const { mutate: bookmarkVideo } = useBookmarkVideo();

  const allVideos: VideoItem[] = data?.pages.flatMap((p) => p.items) ?? [];

  // IntersectionObserver for pagination sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // IntersectionObserver for autoplay — watches each video item
  useEffect(() => {
    if (allVideos.length === 0) return;
    const observers: IntersectionObserver[] = [];

    for (const [idx, el] of videoRefs.current.entries()) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5) {
            setActiveVideoIdx(idx);
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => {
      for (const o of observers) o.disconnect();
    };
  }, [allVideos.length]);

  // Mini player: show when navigating away from home tab
  useEffect(() => {
    if (!pageIsActive && allVideos[activeVideoIdx]) {
      setMiniPlayerVideo(allVideos[activeVideoIdx]);
    } else {
      setMiniPlayerVideo(null);
    }
  }, [pageIsActive, activeVideoIdx, allVideos]);

  const setVideoRef = useCallback((idx: number) => (el: HTMLDivElement | null) => {
    if (el) videoRefs.current.set(idx, el);
    else videoRefs.current.delete(idx);
  }, []);

  const handleLike = useCallback((videoId: string, isLiked: boolean) => {
    likeVideo({ videoId, isLiked });
  }, [likeVideo]);

  const handleBookmark = useCallback((videoId: string) => {
    bookmarkVideo({ videoId });
  }, [bookmarkVideo]);

  const handleViewStory = useCallback((group: StoryGroup, index: number) => {
    if (!storyGroups) return;
    const groupIdx = storyGroups.findIndex((g) => g.userId === group.userId);
    setStoryViewerState({ groups: storyGroups, initialIdx: groupIdx >= 0 ? groupIdx : index });
  }, [storyGroups]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#0d0208]" data-ocid="feed-page">
      {/* Transparent floating header */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex flex-col"
        style={{
          background: "linear-gradient(to bottom, rgba(13,2,8,0.9) 0%, transparent 100%)",
        }}
      >
        {/* App bar */}
        <div className="flex items-center justify-between px-4 pt-safe pb-1">
          <div className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-base"
              style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
            >
              V
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              VibeFlow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              onClick={() => setShowUpload(true)}
              aria-label="Upload video"
              data-ocid="upload-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <title>Upload</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              aria-label="Notifications"
              data-ocid="notifications-btn"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <title>Notifications</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Story bar */}
        <StoryBar
          onAddStory={() => setShowStoryCreator(true)}
          onViewStory={handleViewStory}
        />

        {/* Feed tabs */}
        <div className="flex items-center gap-4 px-4 pb-2">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${
                activeTab === tab.key
                  ? "text-white border-[#e91e63]"
                  : "text-white/50 border-transparent"
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                setActiveVideoIdx(0);
              }}
              data-ocid={`feed-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video feed scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory min-h-0 scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
        data-ocid="feed-scroll"
      >
        {/* Loading skeletons */}
        {isLoading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="relative w-full snap-start snap-always flex-shrink-0"
                style={{ height: "100svh" }}
              >
                <VideoSkeleton />
              </div>
            ))}
          </>
        )}

        {/* Video items */}
        {allVideos.map((video, idx) => (
          <div
            key={video.id}
            ref={setVideoRef(idx)}
            className="relative w-full snap-start snap-always flex-shrink-0"
            style={{ height: "100svh" }}
            data-ocid="feed-item"
          >
            <VideoCard
              video={video}
              isActive={pageIsActive && idx === activeVideoIdx}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onFollow={() => {}}
              onOpenComments={() => {}}
            />
          </div>
        ))}

        {/* Pagination sentinel */}
        <div ref={sentinelRef} className="h-1 flex-shrink-0">
          {isFetchingNextPage && (
            <div className="h-16 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#e91e63] border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Empty state */}
        {!isLoading && allVideos.length === 0 && (
          <div className="h-screen flex flex-col items-center justify-center gap-4" data-ocid="feed-empty">
            <span className="text-6xl">🎬</span>
            <p className="text-white font-bold text-lg">No videos yet</p>
            <p className="text-white/50 text-sm text-center px-8">
              Be the first to share a video with the community!
            </p>
            <button
              type="button"
              className="px-6 py-3 rounded-full font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
              onClick={() => setShowUpload(true)}
              data-ocid="feed-empty-upload-btn"
            >
              Upload Now
            </button>
          </div>
        )}
      </div>

      {/* Mini player */}
      <MiniPlayer
        video={miniPlayerVideo}
        isVisible={!pageIsActive && !!miniPlayerVideo}
        onClose={() => setMiniPlayerVideo(null)}
        onExpand={() => setMiniPlayerVideo(null)}
      />

      {/* Modals */}
      <VideoUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => {}}
      />

      <StoryCreator
        isOpen={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
      />

      {/* Story viewer */}
      <AnimatePresence>
        {storyViewerState && (
          <StoryViewer
            groups={storyViewerState.groups}
            initialGroupIndex={storyViewerState.initialIdx}
            onClose={() => setStoryViewerState(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
