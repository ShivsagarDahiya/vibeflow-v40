import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  VideoCard,
  UserCard,
  HashtagTrend,
  LiveRoom,
  PaginatedVideos,
  PaginatedUsers,
  ExploreTab,
} from "../types/explore";

// ─── Simulated API layer (replace with real fetch calls to Node.js backend) ───

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Video Feed (paginated by tab) ────────────────────────────────────────────

export function useVideoFeed(tab: ExploreTab) {
  return useInfiniteQuery<PaginatedVideos, Error>({
    queryKey: ["videoFeed", tab],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { tab, limit: "12" };
      if (pageParam) params.cursor = pageParam as string;
      return apiFetch<PaginatedVideos>("/api/videos/feed", params);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

// ─── Trending Hashtags ────────────────────────────────────────────────────────

export function useTrendingHashtags() {
  return useQuery<HashtagTrend[], Error>({
    queryKey: ["trendingHashtags"],
    queryFn: () => apiFetch<HashtagTrend[]>("/api/hashtags/trending"),
    staleTime: 60_000,
    placeholderData: placeholderHashtags,
  });
}

// ─── Most Viewed Videos ───────────────────────────────────────────────────────

export function useMostViewed() {
  return useQuery<VideoCard[], Error>({
    queryKey: ["mostViewed"],
    queryFn: () => apiFetch<VideoCard[]>("/api/videos/most-viewed", { limit: "10" }),
    staleTime: 60_000,
    placeholderData: placeholderVideos,
  });
}

// ─── Creators to Follow ───────────────────────────────────────────────────────

export function useCreatorsToFollow() {
  return useQuery<UserCard[], Error>({
    queryKey: ["creatorsToFollow"],
    queryFn: () => apiFetch<UserCard[]>("/api/users/suggested", { limit: "10" }),
    staleTime: 60_000,
    placeholderData: placeholderCreators,
  });
}

// ─── Live Rooms ───────────────────────────────────────────────────────────────

export function useActiveLiveRooms() {
  return useQuery<LiveRoom[], Error>({
    queryKey: ["activeLiveRooms"],
    queryFn: () => apiFetch<LiveRoom[]>("/api/live/active"),
    staleTime: 15_000,
    placeholderData: placeholderLiveRooms,
  });
}

// ─── Creator Leaderboard ──────────────────────────────────────────────────────

export function useCreatorLeaderboard() {
  return useQuery<UserCard[], Error>({
    queryKey: ["creatorLeaderboard"],
    queryFn: () => apiFetch<UserCard[]>("/api/users/leaderboard", { limit: "5" }),
    staleTime: 60_000,
    placeholderData: placeholderLeaderboard,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearchAutocomplete(query: string) {
  return useQuery({
    queryKey: ["searchAutocomplete", query],
    queryFn: async () => {
      const [videos, users] = await Promise.all([
        apiFetch<VideoCard[]>("/api/videos/search", { q: query, limit: "3" }),
        apiFetch<UserCard[]>("/api/users/search", { q: query, limit: "3" }),
      ]);
      return { videos, users };
    },
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });
}

export function useSearchVideos(query: string) {
  return useInfiniteQuery<PaginatedVideos, Error>({
    queryKey: ["searchVideos", query],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { q: query, limit: "12" };
      if (pageParam) params.cursor = pageParam as string;
      return apiFetch<PaginatedVideos>("/api/videos/search/paged", params);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });
}

export function useSearchUsers(query: string) {
  return useInfiniteQuery<PaginatedUsers, Error>({
    queryKey: ["searchUsers", query],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { q: query, limit: "12" };
      if (pageParam) params.cursor = pageParam as string;
      return apiFetch<PaginatedUsers>("/api/users/search/paged", params);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });
}

// ─── Hashtag Page ─────────────────────────────────────────────────────────────

export function useHashtagVideos(tag: string) {
  return useInfiniteQuery<PaginatedVideos, Error>({
    queryKey: ["hashtagVideos", tag],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { tag, limit: "12" };
      if (pageParam) params.cursor = pageParam as string;
      return apiFetch<PaginatedVideos>("/api/hashtags/videos", params);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

export function useHashtagInfo(tag: string) {
  return useQuery({
    queryKey: ["hashtagInfo", tag],
    queryFn: () => apiFetch<{ tag: string; videoCount: number; viewsCount: number }>(`/api/hashtags/${encodeURIComponent(tag)}`),
    staleTime: 60_000,
  });
}

// ─── Follow action ────────────────────────────────────────────────────────────

export function useFollowUser() {
  const qc = useQueryClient();
  return useCallback(
    async (userId: string) => {
      await apiFetch(`/api/users/${userId}/follow`, undefined);
      qc.invalidateQueries({ queryKey: ["creatorsToFollow"] });
      qc.invalidateQueries({ queryKey: ["creatorLeaderboard"] });
    },
    [qc],
  );
}

// ─── Placeholder data (shown while loading — realistic, no Lorem Ipsum) ───────

const placeholderHashtags: HashtagTrend[] = [
  { tag: "viral", videoCount: 2_100_000, viewsCount: 42_000_000 },
  { tag: "love", videoCount: 890_000, viewsCount: 18_000_000 },
  { tag: "dance", videoCount: 1_400_000, viewsCount: 31_000_000 },
  { tag: "fashion", videoCount: 670_000, viewsCount: 14_000_000 },
  { tag: "travel", videoCount: 550_000, viewsCount: 11_000_000 },
  { tag: "music", videoCount: 980_000, viewsCount: 22_000_000 },
  { tag: "fitness", videoCount: 430_000, viewsCount: 9_000_000 },
  { tag: "food", videoCount: 760_000, viewsCount: 16_000_000 },
  { tag: "beauty", videoCount: 510_000, viewsCount: 10_500_000 },
  { tag: "art", videoCount: 320_000, viewsCount: 7_200_000 },
];

const makePlaceholderVideo = (i: number): VideoCard => ({
  id: `ph-v-${i}`,
  thumbnail: `https://picsum.photos/seed/vf${i}/400/700`,
  title: ["Sunset vibes in Bali 🌅", "Night market finds 🌙", "Dance challenge gone viral", "Morning routine glow up", "Studio session secrets", "Hidden beach discovery", "Chef's kiss recipe 🍳", "City lights timelapse", "Yoga flow for beginners", "Street style fits"][i % 10],
  viewsCount: Math.floor(Math.random() * 5_000_000) + 100_000,
  likesCount: Math.floor(Math.random() * 200_000) + 5_000,
  creatorId: `c${i}`,
  creatorName: ["@aurora.creates", "@mikavibes", "@thejasminelife", "@luna.reels", "@zara.world"][i % 5],
  creatorAvatar: `https://picsum.photos/seed/av${i}/80/80`,
  hashtags: [placeholderHashtags[i % 10].tag, placeholderHashtags[(i + 1) % 10].tag],
  duration: Math.floor(Math.random() * 55) + 10,
});

const placeholderVideos: VideoCard[] = Array.from({ length: 10 }, (_, i) => makePlaceholderVideo(i));

const placeholderCreators: UserCard[] = [
  { id: "c1", username: "aurora.creates", displayName: "Aurora Creates", avatar: "https://picsum.photos/seed/cr1/80/80", followerCount: 1_240_000, isVerified: true, bio: "✨ Lifestyle & Travel creator" },
  { id: "c2", username: "mikavibes", displayName: "Mika Vibes", avatar: "https://picsum.photos/seed/cr2/80/80", followerCount: 890_000, isVerified: true, bio: "Dance & Music 🎵" },
  { id: "c3", username: "thejasminelife", displayName: "Jasmine Life", avatar: "https://picsum.photos/seed/cr3/80/80", followerCount: 560_000, isVerified: false, bio: "Food & Fashion 🌸" },
  { id: "c4", username: "luna.reels", displayName: "Luna Reels", avatar: "https://picsum.photos/seed/cr4/80/80", followerCount: 420_000, isVerified: true, bio: "Art & Aesthetics 🎨" },
  { id: "c5", username: "zara.world", displayName: "Zara World", avatar: "https://picsum.photos/seed/cr5/80/80", followerCount: 310_000, isVerified: false, bio: "Travel & Culture 🌍" },
  { id: "c6", username: "nova.beats", displayName: "Nova Beats", avatar: "https://picsum.photos/seed/cr6/80/80", followerCount: 275_000, isVerified: false, bio: "Music Producer 🎧" },
  { id: "c7", username: "elara.fit", displayName: "Elara Fit", avatar: "https://picsum.photos/seed/cr7/80/80", followerCount: 198_000, isVerified: false, bio: "Fitness & Wellness 💪" },
];

const placeholderLeaderboard: UserCard[] = placeholderCreators.slice(0, 5);

const placeholderLiveRooms: LiveRoom[] = [
  { id: "lr1", hostId: "c1", hostName: "Aurora Creates", hostAvatar: "https://picsum.photos/seed/cr1/80/80", title: "Morning Q&A with you 💬", thumbnail: "https://picsum.photos/seed/live1/400/600", viewerCount: 12_400, startedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "lr2", hostId: "c2", hostName: "Mika Vibes", hostAvatar: "https://picsum.photos/seed/cr2/80/80", title: "Live dance practice session 🕺", thumbnail: "https://picsum.photos/seed/live2/400/600", viewerCount: 8_900, startedAt: new Date(Date.now() - 900000).toISOString() },
  { id: "lr3", hostId: "c4", hostName: "Luna Reels", hostAvatar: "https://picsum.photos/seed/cr4/80/80", title: "Digital art creation live 🎨", thumbnail: "https://picsum.photos/seed/live3/400/600", viewerCount: 5_200, startedAt: new Date(Date.now() - 2700000).toISOString() },
  { id: "lr4", hostId: "c6", hostName: "Nova Beats", hostAvatar: "https://picsum.photos/seed/cr6/80/80", title: "Producing beats from scratch 🎵", thumbnail: "https://picsum.photos/seed/live4/400/600", viewerCount: 3_100, startedAt: new Date(Date.now() - 600000).toISOString() },
];
