import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PaginatedCandidates,
  PaginatedMatches,
  PaginatedRequests,
} from "../types/match";

// ---------------------------------------------------------------------------
// API helpers — swap BASE_URL for your real Node.js endpoint
// ---------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Match Candidates (infinite / cursor-paginated)
// ---------------------------------------------------------------------------
export function useMatchCandidates(limit = 10) {
  return useInfiniteQuery<PaginatedCandidates>({
    queryKey: ["match-candidates"],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const qs = cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`;
      return apiFetch<PaginatedCandidates>(`/matches/candidates${qs}`);
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Matches list
// ---------------------------------------------------------------------------
export function useMatches(limit = 20) {
  return useInfiniteQuery<PaginatedMatches>({
    queryKey: ["matches"],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const qs = cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`;
      return apiFetch<PaginatedMatches>(`/matches${qs}`);
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Pending requests
// ---------------------------------------------------------------------------
export function usePendingRequests(limit = 20) {
  return useInfiniteQuery<PaginatedRequests>({
    queryKey: ["match-requests"],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const qs = cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`;
      return apiFetch<PaginatedRequests>(`/matches/requests${qs}`);
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useSendMatchRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toUserId: string) =>
      apiFetch<{ success: boolean }>("/matches/request", {
        method: "POST",
        body: JSON.stringify({ toUserId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["match-candidates"] }),
  });
}

export function useAcceptMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      apiFetch<{ success: boolean; isMatch: boolean }>("/matches/accept", {
        method: "POST",
        body: JSON.stringify({ requestId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["match-requests"] });
    },
  });
}

export function useDeclineMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      apiFetch<{ success: boolean }>("/matches/decline", {
        method: "POST",
        body: JSON.stringify({ requestId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["match-requests"] }),
  });
}

export function useUnmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchedUserId: string) =>
      apiFetch<{ success: boolean }>("/matches/unmatch", {
        method: "POST",
        body: JSON.stringify({ matchedUserId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
}
