import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

// ─── API base ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PremiumTier = "free" | "fan" | "creator" | "vip";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverPhotoUrl?: string;
  pronouns?: string;
  website?: string;
  location?: string;
  gender?: string;
  birthday?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  nicheTags: string[];
  videoCount: number;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  tier: PremiumTier;
  showActivityStatus: boolean;
  isOnline: boolean;
  lastActiveAt?: string;
  isFollowing?: boolean;
  isMatched?: boolean;
}

export interface ProfileHighlight {
  id: string;
  title: string;
  coverUrl: string;
  storyCount: number;
  storyIds: string[];
}

export interface AnalyticsData {
  totalViews: number;
  followerGrowth: number[];
  engagementRate: number;
  topVideoId: string;
  topVideoThumbnail: string;
  topVideoViews: number;
  growthLabels: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  category: "upload" | "social" | "trending" | "premium";
}

export interface UserVideoPage {
  videos: Array<{
    id: string;
    thumbnailUrl: string;
    viewsCount: number;
    likesCount: number;
    duration: number;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AppSettings {
  // Notifications
  pushEnabled: boolean;
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  notifyMatches: boolean;
  notifyMentions: boolean;
  notifyDuets: boolean;
  // Privacy
  privacyMode: "public" | "private";
  showActivityStatus: boolean;
  allowDMs: "everyone" | "matches" | "none";
  allowDuets: "everyone" | "followers" | "none";
  allowStitch: "everyone" | "followers" | "none";
  // Content
  autoplay: boolean;
  videoQuality: "auto" | "hd" | "sd";
  sensitiveContent: boolean;
  blockedHashtags: string[];
  // App
  theme: "dark" | "light" | "system";
  language: string;
  // Security
  twoFactorEnabled: boolean;
  dataCollection: boolean;
}

export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  blockedAt: string;
}

// ─── Own Profile ──────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery<UserProfile>({
    queryKey: ["myProfile"],
    queryFn: () => apiFetch<UserProfile>("/api/profile/me"),
    staleTime: 2 * 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      apiFetch<UserProfile>("/api/profile/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["myProfile"] });
      const prev = qc.getQueryData<UserProfile>(["myProfile"]);
      if (prev) qc.setQueryData<UserProfile>(["myProfile"], { ...prev, ...data });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["myProfile"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["myProfile"] }),
  });
}

// ─── Public Profile ───────────────────────────────────────────────────────────

export function useUserProfile(userId: string) {
  return useQuery<UserProfile>({
    queryKey: ["userProfile", userId],
    queryFn: () => apiFetch<UserProfile>(`/api/profile/${userId}`),
    staleTime: 2 * 60_000,
    enabled: !!userId,
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      apiFetch<{ success: boolean }>(`/api/users/${userId}/${follow ? "follow" : "unfollow"}`, {
        method: "POST",
      }),
    onMutate: async ({ userId, follow }) => {
      await qc.cancelQueries({ queryKey: ["userProfile", userId] });
      const prev = qc.getQueryData<UserProfile>(["userProfile", userId]);
      if (prev) {
        qc.setQueryData<UserProfile>(["userProfile", userId], {
          ...prev,
          isFollowing: follow,
          followerCount: follow ? prev.followerCount + 1 : prev.followerCount - 1,
        });
      }
      return { prev };
    },
    onError: (_err, { userId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(["userProfile", userId], ctx.prev);
    },
  });
}

export function useSubscribeUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: PremiumTier }) =>
      apiFetch<{ success: boolean }>(`/api/users/${userId}/subscribe`, {
        method: "POST",
        body: JSON.stringify({ tier }),
      }),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
  });
}

// ─── Highlights ───────────────────────────────────────────────────────────────

export function useHighlights(userId: string) {
  return useQuery<ProfileHighlight[]>({
    queryKey: ["highlights", userId],
    queryFn: () => apiFetch<ProfileHighlight[]>(`/api/users/${userId}/highlights`),
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useMyAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ["myAnalytics"],
    queryFn: () => apiFetch<AnalyticsData>("/api/analytics/me"),
    staleTime: 5 * 60_000,
  });
}

// ─── Achievements ────────────────────────────────────────────────────────────

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ["achievements"],
    queryFn: () => apiFetch<Achievement[]>("/api/achievements"),
    staleTime: 10 * 60_000,
  });
}

// ─── Videos (paginated) ───────────────────────────────────────────────────────

export function useUserVideos(userId: string, tab: "videos" | "liked" | "saved" | "duets") {
  return useInfiniteQuery<UserVideoPage>({
    queryKey: ["userVideos", userId, tab],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const qs = cursor ? `?cursor=${cursor}&limit=12` : "?limit=12";
      const endpoint = tab === "videos" ? "videos" : tab === "liked" ? "liked" : tab === "saved" ? "saved" : "duets";
      return apiFetch<UserVideoPage>(`/api/users/${userId}/${endpoint}${qs}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
    enabled: !!userId,
  });
}

// ─── Followers / Following ───────────────────────────────────────────────────

export function useFollowers(userId: string) {
  return useQuery<UserProfile[]>({
    queryKey: ["followers", userId],
    queryFn: () => apiFetch<UserProfile[]>(`/api/users/${userId}/followers`),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useQuery<UserProfile[]>({
    queryKey: ["following", userId],
    queryFn: () => apiFetch<UserProfile[]>(`/api/users/${userId}/following`),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<AppSettings>("/api/settings"),
    staleTime: 0, // always fresh
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) =>
      apiFetch<AppSettings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["settings"] });
      const prev = qc.getQueryData<AppSettings>(["settings"]);
      if (prev) qc.setQueryData<AppSettings>(["settings"], { ...prev, ...data });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["settings"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// ─── Blocked Users ───────────────────────────────────────────────────────────

export function useBlockedUsers() {
  return useQuery<BlockedUser[]>({
    queryKey: ["blockedUsers"],
    queryFn: () => apiFetch<BlockedUser[]>("/api/users/blocked"),
    staleTime: 60_000,
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<{ success: boolean }>(`/api/users/${userId}/unblock`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blockedUsers"] }),
  });
}

export function useUpgradeTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: PremiumTier) =>
      apiFetch<{ success: boolean; tier: PremiumTier }>("/api/profile/upgrade", {
        method: "POST",
        body: JSON.stringify({ tier }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// ─── Live rooms ───────────────────────────────────────────────────────────────

export interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  viewerCount: number;
  isLive: boolean;
  startedAt: string;
}

export interface LiveChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  emoji?: string;
  createdAt: string;
}

export function useCreateLiveRoom() {
  return useMutation({
    mutationFn: (title: string) =>
      apiFetch<LiveRoom>("/api/live/create", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
  });
}

export function useJoinLiveRoom(roomId: string) {
  return useMutation({
    mutationFn: () => apiFetch<{ token: string }>(`/api/live/${roomId}/join`, { method: "POST" }),
  });
}

export function useLeaveLiveRoom() {
  return useMutation({
    mutationFn: (roomId: string) =>
      apiFetch<{ success: boolean }>(`/api/live/${roomId}/leave`, { method: "POST" }),
  });
}

export function useSendLiveMessage() {
  return useMutation({
    mutationFn: ({ roomId, text, emoji }: { roomId: string; text: string; emoji?: string }) =>
      apiFetch<LiveChatMessage>(`/api/live/${roomId}/chat`, {
        method: "POST",
        body: JSON.stringify({ text, emoji }),
      }),
  });
}

export function useLiveChatMessages(roomId: string) {
  return useQuery<LiveChatMessage[]>({
    queryKey: ["liveChat", roomId],
    queryFn: () => apiFetch<LiveChatMessage[]>(`/api/live/${roomId}/chat`),
    enabled: !!roomId,
    refetchInterval: 500,
    staleTime: 0,
  });
}

export function useActiveLiveRoom(roomId: string) {
  return useQuery<LiveRoom>({
    queryKey: ["liveRoom", roomId],
    queryFn: () => apiFetch<LiveRoom>(`/api/live/${roomId}`),
    enabled: !!roomId,
    refetchInterval: 5000,
    staleTime: 0,
  });
}
