import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Video, Users, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchVideos, useSearchUsers, useActiveLiveRooms } from "../hooks/useExplore";
import { VideoThumbnailCard, UserAvatarCard } from "../components/VideoThumbnailCard";
import { formatCount } from "../lib/format";
import type { SearchTab } from "../types/explore";

const TABS: { key: SearchTab; label: string; icon: React.ReactNode }[] = [
  { key: "videos", label: "Videos", icon: <Video className="w-4 h-4" /> },
  { key: "users", label: "Creators", icon: <Users className="w-4 h-4" /> },
  { key: "live", label: "Live", icon: <Radio className="w-4 h-4" /> },
];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") ?? "";
  const [activeTab, setActiveTab] = useState<SearchTab>("videos");
  const [inputVal, setInputVal] = useState(q);

  // Update input when URL changes
  useEffect(() => {
    setInputVal(q);
  }, [q]);

  const {
    data: videosData,
    fetchNextPage: fetchMoreVideos,
    hasNextPage: hasMoreVideos,
    isFetchingNextPage: fetchingMoreVideos,
    isLoading: videosLoading,
  } = useSearchVideos(q);

  const {
    data: usersData,
    fetchNextPage: fetchMoreUsers,
    hasNextPage: hasMoreUsers,
    isFetchingNextPage: fetchingMoreUsers,
    isLoading: usersLoading,
  } = useSearchUsers(q);

  const { data: liveRooms, isLoading: liveLoading } = useActiveLiveRooms();

  const allVideos = videosData?.pages.flatMap((p) => p.videos) ?? [];
  const allUsers = usersData?.pages.flatMap((p) => p.users) ?? [];

  // Sentinel refs per tab
  const videoSentinelRef = useRef<HTMLDivElement>(null);
  const userSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = videoSentinelRef.current;
    if (!el || activeTab !== "videos") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreVideos && !fetchingMoreVideos) {
          void fetchMoreVideos();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeTab, hasMoreVideos, fetchingMoreVideos, fetchMoreVideos]);

  useEffect(() => {
    const el = userSentinelRef.current;
    if (!el || activeTab !== "users") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreUsers && !fetchingMoreUsers) {
          void fetchMoreUsers();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeTab, hasMoreUsers, fetchingMoreUsers, fetchMoreUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Go back"
            data-ocid="search-back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-white/8 rounded-2xl px-4 py-2.5 border border-white/10 focus-within:border-rose-500/50 transition-colors">
            <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <input
              type="search"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none min-w-0"
              data-ocid="search-results-input"
            />
          </form>
        </div>

        {q && (
          <p className="text-zinc-500 text-xs px-1 mb-2">
            Results for <span className="text-white font-medium">"{q}"</span>
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/8"
              }`}
              data-ocid={`search-tab-${tab.key}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {/* Videos Tab */}
        {activeTab === "videos" && (
          <motion.div
            key="videos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {!q.trim() && (
              <EmptySearch label="Search for videos, sounds, and more" />
            )}
            {q.trim() && (
              <>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {videosLoading
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
                      ))
                    : allVideos.map((v) => (
                        <VideoThumbnailCard
                          key={v.id}
                          video={v}
                          onClick={() => navigate(`/video/${v.id}`)}
                        />
                      ))}
                </div>
                <div ref={videoSentinelRef} className="h-16 flex items-center justify-center">
                  {fetchingMoreVideos && <LoadingDots />}
                  {!videosLoading && allVideos.length === 0 && (
                    <EmptyResult query={q} type="videos" />
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {!q.trim() && <EmptySearch label="Search for creators and friends" />}
            {q.trim() && (
              <>
                <div className="space-y-2">
                  {usersLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                      ))
                    : allUsers.map((u) => (
                        <motion.button
                          type="button"
                          key={u.id}
                          onClick={() => navigate(`/profile/${u.id}`)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/4 hover:bg-white/8 border border-white/6 transition-colors text-left"
                          whileHover={{ scale: 1.01 }}
                          data-ocid="user-result-row"
                        >
                          <img
                            src={u.avatar}
                            alt={u.displayName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/30"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-semibold text-sm truncate">{u.displayName}</p>
                              {u.isVerified && <span className="text-sky-400 flex-shrink-0">✓</span>}
                            </div>
                            <p className="text-zinc-400 text-xs">@{u.username}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{formatCount(u.followerCount)} followers</p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              {u.isFollowing ? "Following" : "Follow"}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                </div>
                <div ref={userSentinelRef} className="h-16 flex items-center justify-center">
                  {fetchingMoreUsers && <LoadingDots />}
                  {!usersLoading && allUsers.length === 0 && (
                    <EmptyResult query={q} type="creators" />
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Live Tab */}
        {activeTab === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {liveLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : liveRooms && liveRooms.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {liveRooms.map((room) => (
                  <motion.button
                    type="button"
                    key={room.id}
                    onClick={() => navigate(`/live/${room.id}`)}
                    className="relative rounded-2xl overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    whileHover={{ scale: 1.02 }}
                    data-ocid="live-search-card"
                  >
                    <img
                      src={room.thumbnail}
                      alt={room.title}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      👁 {formatCount(room.viewerCount)}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={room.hostAvatar}
                          alt={room.hostName}
                          className="w-6 h-6 rounded-full ring-1 ring-white/30"
                        />
                        <p className="text-white text-xs font-semibold truncate">{room.hostName}</p>
                      </div>
                      <p className="text-zinc-300 text-xs truncate">{room.title}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16" data-ocid="live-empty-state">
                <div className="text-5xl mb-4">📡</div>
                <p className="text-white font-semibold text-lg">No one's live right now</p>
                <p className="text-zinc-500 text-sm mt-2">Check back soon — creators go live every day</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-rose-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function EmptySearch({ label }: { label: string }) {
  return (
    <div className="text-center py-16" data-ocid="search-empty-prompt">
      <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
      <p className="text-zinc-400 text-sm">{label}</p>
    </div>
  );
}

function EmptyResult({ query, type }: { query: string; type: string }) {
  return (
    <div className="text-center py-12 w-full" data-ocid="search-no-results">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-white font-semibold">No {type} found</p>
      <p className="text-zinc-500 text-sm mt-1">No results for "{query}"</p>
    </div>
  );
}
