import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Hash } from "lucide-react";
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useHashtagVideos, useHashtagInfo } from "../hooks/useExplore";
import { VideoThumbnailCard } from "../components/VideoThumbnailCard";
import { formatCount } from "../lib/format";

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const decodedTag = tag ? decodeURIComponent(tag) : "";

  const { data: info, isLoading: infoLoading } = useHashtagInfo(decodedTag);
  const {
    data: videoData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: videosLoading,
  } = useHashtagVideos(decodedTag);

  const allVideos = videoData?.pages.flatMap((p) => p.videos) ?? [];

  // IntersectionObserver sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Go back"
            data-ocid="hashtag-back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-display">#{decodedTag}</h1>
              {infoLoading ? (
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse mt-0.5" />
              ) : (
                <p className="text-zinc-400 text-xs">
                  {info ? `${formatCount(info.videoCount)} videos · ${formatCount(info.viewsCount)} views` : "Loading..."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {!infoLoading && info && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-6 px-4 py-4 bg-gradient-to-r from-rose-500/10 to-transparent border-b border-white/5"
        >
          <Stat label="Videos" value={formatCount(info.videoCount)} />
          <Stat label="Total Views" value={formatCount(info.viewsCount)} />
        </motion.div>
      )}

      {/* Grid */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {videosLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
              ))
            : allVideos.map((v, idx) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx < 12 ? idx * 0.04 : 0, duration: 0.25 }}
                >
                  <VideoThumbnailCard video={v} onClick={() => navigate(`/video/${v.id}`)} />
                </motion.div>
              ))}
        </div>

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-2">
          {isFetchingNextPage && (
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-rose-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
          {!hasNextPage && allVideos.length > 0 && (
            <p className="text-zinc-600 text-sm">All #{decodedTag} videos loaded ✨</p>
          )}
          {!videosLoading && allVideos.length === 0 && (
            <div className="text-center py-12" data-ocid="hashtag-empty-state">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-white font-semibold">No videos yet</p>
              <p className="text-zinc-500 text-sm mt-1">Be the first to post with #{decodedTag}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-white font-bold text-lg">{value}</p>
      <p className="text-zinc-500 text-xs">{label}</p>
    </div>
  );
}
