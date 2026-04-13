export interface VideoCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  isFollowing: boolean;
}

export interface VideoItem {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[];
  soundName: string;
  soundArtist: string;
  creator: VideoCreator;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  quality: "HD" | "SD";
  duration: number;
  createdAt: string;
  hasPoll?: boolean;
}

export interface FeedPage {
  items: VideoItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type FeedTab = "foryou" | "following" | "trending" | "popular";

export interface StoryItem {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  caption?: string;
  isViewed: boolean;
  expiresAt: string;
  likes: number;
  isLiked: boolean;
  hasPoll?: boolean;
  pollQuestion?: string;
  pollOptions?: { id: string; text: string; votes: number }[];
  reactions?: { emoji: string; count: number }[];
  createdAt: string;
}

export interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl: string;
  stories: StoryItem[];
  hasUnviewed: boolean;
  isOwn?: boolean;
}

export type Reaction = "❤️" | "😂" | "😮" | "😢" | "😡" | "🔥" | "🎉";
