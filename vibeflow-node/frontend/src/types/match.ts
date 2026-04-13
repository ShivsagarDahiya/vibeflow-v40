export interface MatchCandidate {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverPhoto?: string;
  bio?: string;
  nicheTags: string[];
  hasVideos: boolean;
  compatibilityScore: number; // 0–100
  location?: string;
  joinedAt?: string;
  followerCount?: number;
}

export interface MatchUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  lastActivity?: string;
  matchedAt: string;
}

export interface PendingRequest {
  id: string;
  fromUserId: string;
  fromUser: MatchCandidate;
  sentAt: string;
}

export interface PaginatedCandidates {
  candidates: MatchCandidate[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedMatches {
  matches: MatchUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedRequests {
  requests: PendingRequest[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type SwipeDirection = "left" | "right" | "up" | null;
export type MatchTab = "discover" | "matches" | "requests";
