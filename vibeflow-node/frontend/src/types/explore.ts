export interface VideoCard {
  id: string;
  thumbnail: string;
  title: string;
  viewsCount: number;
  likesCount: number;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  hashtags: string[];
  duration: number;
  isLive?: boolean;
}

export interface UserCard {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  followerCount: number;
  bio?: string;
  isFollowing?: boolean;
  isVerified?: boolean;
}

export interface HashtagTrend {
  tag: string;
  videoCount: number;
  viewsCount: number;
}

export interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  thumbnail: string;
  viewerCount: number;
  startedAt: string;
}

export interface PaginatedVideos {
  videos: VideoCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedUsers {
  users: UserCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type ExploreTab = "forYou" | "following" | "trending" | "popular";
export type SearchTab = "videos" | "users" | "live";
