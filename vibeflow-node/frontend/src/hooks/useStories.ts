import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StoryGroup, StoryItem } from "../types/feed";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchStories(): Promise<StoryGroup[]> {
  try {
    const [active, mine] = await Promise.all([
      apiFetch<StoryGroup[]>("/api/stories?limit=20"),
      apiFetch<StoryGroup>("/api/stories/me"),
    ]);
    // Ensure own story group is first; deduplicate
    const others = active.filter((g) => !g.isOwn);
    return [mine, ...others];
  } catch {
    return [];
  }
}

export function useStories() {
  return useQuery<StoryGroup[]>({
    queryKey: ["stories"],
    queryFn: fetchStories,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useViewStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId }: { storyId: string }) => {
      await apiFetch<{ success: boolean }>(`/api/stories/${storyId}/view`, { method: "POST" });
      return storyId;
    },
    onSuccess: (storyId) => {
      queryClient.setQueryData(["stories"], (old: StoryGroup[] | undefined) => {
        if (!old) return old;
        return old.map((group) => ({
          ...group,
          stories: group.stories.map((s) =>
            s.id === storyId ? { ...s, isViewed: true } : s
          ),
          hasUnviewed: group.stories.some((s) => s.id !== storyId && !s.isViewed),
        }));
      });
    },
  });
}

export function useReactToStory() {
  return useMutation({
    mutationFn: async ({ storyId, emoji }: { storyId: string; emoji: string }) => {
      await apiFetch<{ success: boolean }>(`/api/stories/${storyId}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
      return { storyId, emoji };
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mediaUrl: string; mediaType: "photo" | "video"; caption?: string }) => {
      return apiFetch<StoryItem>("/api/stories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newStory) => {
      queryClient.setQueryData(["stories"], (old: StoryGroup[] | undefined) => {
        if (!old) return old;
        return old.map((group) => {
          if (group.isOwn) {
            return { ...group, stories: [newStory, ...group.stories], hasUnviewed: true };
          }
          return group;
        });
      });
    },
  });
}

export function useVoteOnPoll() {
  return useMutation({
    mutationFn: async ({ storyId, optionId }: { storyId: string; optionId: string }) => {
      await apiFetch<{ success: boolean }>(`/api/stories/${storyId}/poll/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId }),
      });
      return { storyId, optionId };
    },
  });
}
