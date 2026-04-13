import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedTab, FeedPage, VideoItem } from "../types/feed";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function fetchFeedPage(tab: FeedTab, cursor: string | null): Promise<FeedPage> {
  const qs = new URLSearchParams({ tab, limit: "10" });
  if (cursor) qs.set("cursor", cursor);

  const res = await fetch(`${API_BASE}/api/feed?${qs.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  const data = await res.json() as { items: VideoItem[]; nextCursor: string | null; hasMore: boolean };
  return data;
}

export function useFeed(tab: FeedTab) {
  return useInfiniteQuery<FeedPage, Error>({
    queryKey: ["feed", tab],
    queryFn: ({ pageParam }) => fetchFeedPage(tab, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useLikeVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      const res = await fetch(
        `${API_BASE}/api/videos/${videoId}/${isLiked ? "like" : "unlike"}`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error("Like failed");
      return { videoId, isLiked };
    },
    onMutate: async ({ videoId, isLiked }) => {
      const tabs: FeedTab[] = ["foryou", "following", "trending", "popular"];
      const snapshots: Record<string, unknown> = {};

      for (const tab of tabs) {
        const key = ["feed", tab];
        await queryClient.cancelQueries({ queryKey: key });
        snapshots[tab] = queryClient.getQueryData(key);

        queryClient.setQueryData(key, (old: { pages: FeedPage[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((v) =>
                v.id === videoId
                  ? { ...v, isLiked, likes: isLiked ? v.likes + 1 : v.likes - 1 }
                  : v
              ),
            })),
          };
        });
      }

      return { snapshots };
    },
    onError: (_err, { videoId: _videoId }, context) => {
      if (!context) return;
      const tabs: FeedTab[] = ["foryou", "following", "trending", "popular"];
      for (const tab of tabs) {
        if (context.snapshots[tab]) {
          queryClient.setQueryData(["feed", tab], context.snapshots[tab]);
        }
      }
    },
  });
}

export function useBookmarkVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Bookmark failed");
      return { videoId };
    },
    onMutate: async ({ videoId }) => {
      const tabs: FeedTab[] = ["foryou", "following", "trending", "popular"];
      for (const tab of tabs) {
        queryClient.setQueryData(["feed", tab], (old: { pages: FeedPage[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((v) =>
                v.id === videoId ? { ...v, isBookmarked: !v.isBookmarked } : v
              ),
            })),
          };
        });
      }
    },
  });
}
