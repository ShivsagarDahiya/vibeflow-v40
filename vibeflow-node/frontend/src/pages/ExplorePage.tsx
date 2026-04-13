import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Users, Flame, Zap, Radio } from "lucide-react";
import {
  useVideoFeed,
  useTrendingHashtags,
  useMostViewed,
  useCreatorsToFollow,
  useActiveLiveRooms,
  useCreatorLeaderboard,
  useSearchAutocomplete,
  useFollowUser,
} from "../hooks/useExplore";
import { VideoThumbnailCard, UserAvatarCard } from "../components/VideoThumbnailCard";
import { formatCount } from "../lib/format";
import type { ExploreTab } from "../types/explore";

const TABS: { key: ExploreTab; label: string; icon: React.ReactNode }[] = [
  { key: "forYou", label: "For You", icon: <Zap className="w-3.5 h-3.5" /> },
  { key: "following", label: "Following", icon: <Users className="w-3.5 h-3.5" /> },
  { key: "trending", label: "Trending", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "popular", label: "Popular", icon: <Flame className="w-3.5 h-3.5" /> },
];

// Debounce hook
function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ExploreTab>("forYou");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: hashtagData, isLoading: hashtagsLoading } = useTrendingHashtags();
  const { data: mostViewed, isLoading: mostViewedLoading } = useMostViewed();
  const { data: creators, isLoading: creatorsLoading } = useCreatorsToFollow();
  const { data: liveRooms, isLoading: liveLoading } = useActiveLiveRooms();
  const { data: leaderboard, isLoading: lbLoading } = useCreatorLeaderboard();
  const { data: autoComplete, isLoading: acLoading } = useSearchAutocomplete(debouncedQuery);
  const followUser = useFollowUser();

  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading,
  } = useVideoFeed(activeTab);

  const allVideos = feedData?.pages.flatMap((p) => p.videos) ?? [];

  // IntersectionObserver sentinel for infinite scroll
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const showDropdown = searchFocused && debouncedQuery.length >= 2;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        {/* Search bar */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-3 bg-white/8 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-rose-500/50 transition-colors">
            <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                  setSearchFocused(false);
                }
              }}
              placeholder="Search videos, creators, sounds..."
              className="flex-1 bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none min-w-0"
              data-ocid="explore-search-input"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                data-ocid="search-autocomplete"
              >
                {acLoading && (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}
                {autoComplete && (
                  <>
                    {autoComplete.users.length > 0 && (
                      <div className="p-3 border-b border-white/5">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Creators</p>
                        {autoComplete.users.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => navigate(`/user/${u.id}`)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
                            data-ocid="autocomplete-user"
                          >
                            <img src={u.avatar} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium text-white truncate">{u.displayName}</p>
                              <p className="text-xs text-zinc-400">@{u.username}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {autoComplete.videos.length > 0 && (
                      <div className="p-3">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Videos</p>
                        {autoComplete.videos.map((v) => (
                          <button
                            type="button"
                            key={v.id}
                            onClick={() => navigate(`/video/${v.id}`)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
                            data-ocid="autocomplete-video"
                          >
                            <img src={v.thumbnail} alt={v.title} className="w-8 h-14 rounded-lg object-cover" />
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium text-white truncate">{v.title}</p>
                              <p className="text-xs text-zinc-400">{formatCount(v.viewsCount)} views</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                        setSearchFocused(false);
                      }}
                      className="w-full py-3 text-sm text-rose-400 font-medium hover:bg-white/5 transition-colors border-t border-white/5"
                      data-ocid="autocomplete-see-all"
                    >
                      See all results for "{query}"
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeTab === tab.key
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/8"
              }`}
              data-ocid={`tab-${tab.key}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-6 space-y-8">
        {/* Trending Hashtags */}
        <section>
          <SectionHeader icon={<TrendingUp className="w-4 h-4 text-rose-500" />} title="Trending Hashtags" />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-3 -mx-4 px-4">
            {hashtagsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-9 w-24 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
                ))
              : hashtagData?.map((ht) => (
                  <button
                    type="button"
                    key={ht.tag}
                    onClick={() => navigate(`/hashtag/${encodeURIComponent(ht.tag)}`)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/8 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 transition-all duration-200 text-sm font-medium text-white"
                    data-ocid="hashtag-pill"
                  >
                    <span className="text-rose-400">#</span>
                    {ht.tag}
                    <span className="text-zinc-400 text-xs ml-0.5">{formatCount(ht.videoCount)}</span>
                  </button>
                ))}
          </div>
        </section>

        {/* Most Viewed */}
        <section>
          <SectionHeader icon={<Flame className="w-4 h-4 text-amber-400" />} title="Most Viewed" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pt-3 -mx-4 px-4">
            {mostViewedLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-28 aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
                ))
              : mostViewed?.map((v) => (
                  <div key={v.id} className="flex-shrink-0 w-28">
                    <VideoThumbnailCard video={v} onClick={() => navigate(`/video/${v.id}`)} />
                  </div>
                ))}
          </div>
        </section>

        {/* Creators to Follow */}
        <section>
          <SectionHeader icon={<Users className="w-4 h-4 text-sky-400" />} title="Creators to Follow" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pt-3 -mx-4 px-4">
            {creatorsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-32 h-44 rounded-2xl bg-white/5 animate-pulse" />
                ))
              : creators?.map((c) => (
                  <UserAvatarCard
                    key={c.id}
                    user={c}
                    onFollow={(id) => void followUser(id)}
                  />
                ))}
          </div>
        </section>

        {/* Live Now */}
        <section>
          <SectionHeader
            icon={<Radio className="w-4 h-4 text-red-500 animate-pulse" />}
            title="Live Now"
            badge={liveRooms?.length ? `${liveRooms.length} live` : undefined}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pt-3 -mx-4 px-4">
            {liveLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-40 h-56 rounded-2xl bg-white/5 animate-pulse" />
                ))
              : liveRooms?.map((room) => (
                  <button
                    type="button"
                    key={room.id}
                    onClick={() => navigate(`/live/${room.id}`)}
                    className="flex-shrink-0 w-40 relative rounded-2xl overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    data-ocid="live-room-card"
                  >
                    <img
                      src={room.thumbnail}
                      alt={room.title}
                      className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    {/* Live badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    {/* Viewer count */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      <span>👁</span>
                      {formatCount(room.viewerCount)}
                    </div>
                    {/* Host info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={room.hostAvatar}
                          alt={room.hostName}
                          className="w-6 h-6 rounded-full ring-1 ring-white/30"
                        />
                        <p className="text-white text-xs font-semibold truncate">{room.hostName}</p>
                      </div>
                      <p className="text-zinc-300 text-xs truncate leading-tight">{room.title}</p>
                    </div>
                  </button>
                ))}
          </div>
        </section>

        {/* Creator Leaderboard */}
        <section>
          <SectionHeader
            icon={<span className="text-amber-400 text-sm">🏆</span>}
            title="Creator Leaderboard"
          />
          <div className="mt-3 rounded-2xl bg-white/4 border border-white/8 overflow-hidden divide-y divide-white/5">
            {lbLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/3 animate-pulse" />
                ))
              : leaderboard?.map((creator, idx) => (
                  <div
                    key={creator.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                    data-ocid="leaderboard-row"
                  >
                    <span
                      className={`w-7 text-center font-bold text-lg ${
                        idx === 0 ? "text-amber-400" : idx === 1 ? "text-zinc-300" : idx === 2 ? "text-amber-700" : "text-zinc-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <img
                      src={creator.avatar}
                      alt={creator.displayName}
                      className={`w-10 h-10 rounded-full object-cover ring-2 ${
                        idx === 0 ? "ring-amber-400" : "ring-white/10"
                      }`}
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{creator.displayName}</p>
                      <p className="text-zinc-400 text-xs">{formatCount(creator.followerCount)} followers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void followUser(creator.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 hover:border-rose-500 transition-all duration-200"
                      data-ocid="leaderboard-follow-btn"
                    >
                      Follow
                    </button>
                  </div>
                ))}
          </div>
        </section>

        {/* Feed Grid */}
        <section>
          <SectionHeader icon={<Zap className="w-4 h-4 text-rose-500" />} title={TABS.find((t) => t.key === activeTab)?.label ?? "Feed"} />
          <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2">
            {feedLoading
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
          {/* Infinite scroll sentinel */}
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
              <p className="text-zinc-600 text-sm">You're all caught up ✨</p>
            )}
          </div>
        </section>
      </div>

      {/* Hidden pull-to-refresh trigger */}
      <button type="button" onClick={handleRefresh} className="sr-only" data-ocid="pull-refresh-btn">Refresh</button>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-semibold text-white text-base font-display">{title}</h2>
      {badge && (
        <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30">
          {badge}
        </span>
      )}
    </div>
  );
}
