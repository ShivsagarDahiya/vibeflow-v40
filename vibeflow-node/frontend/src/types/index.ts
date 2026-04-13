// Central TypeScript types for VibeFlow — matching backend Motoko types

// ===== PRIMITIVES =====
export type UserId = string; // Principal string
export type VideoId = string;
export type CommentId = string;
export type StoryId = string;
export type MessageId = string;
export type ConversationId = string;
export type NotificationId = string;
export type SignalId = string;
export type RoomId = string;
export type Timestamp = bigint; // nanoseconds

// ===== PAGINATION =====
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null; // null when no more
  hasMore: boolean;
}

// ===== ENUMS =====
export type FeedType = "forYou" | "following" | "trending" | "popular";
export type VideoQuality = "hd" | "sd";
export type StoryMediaType = "photo" | "video";
export type PremiumTier = "none" | "fan" | "creator" | "vip";
export type SignalType = "offer" | "answer" | "ice" | "end";
export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "followRequest"
  | "matchRequest"
  | "matchAccepted"
  | "mention";
export type CallState = "idle" | "calling" | "ringing" | "connected";

// ===== VIDEO =====
export interface Video {
  id: VideoId;
  creatorId: UserId;
  url: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bookmarksCount: number;
  viewsCount: number;
  duration: number; // seconds
  quality: VideoQuality;
  isLive: boolean;
  createdAt: Timestamp;
}

// ===== COMMENT =====
export interface Comment {
  id: CommentId;
  videoId: VideoId;
  authorId: UserId;
  text: string;
  likesCount: number;
  parentId: CommentId | null;
  repliesCount: number;
  createdAt: Timestamp;
}

// ===== STORY =====
export interface StoryPoll {
  question: string;
  options: string[];
  votes: [UserId, number][];
}

export interface Story {
  id: StoryId;
  authorId: UserId;
  mediaUrl: string;
  mediaType: StoryMediaType;
  duration: number;
  expiresAt: Timestamp;
  viewsCount: number;
  reactions: [UserId, string][];
  poll: StoryPoll | null;
  createdAt: Timestamp;
}

// ===== USER PROFILE =====
export interface UserProfile {
  userId: UserId;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  isVerified: boolean;
  premiumTier: PremiumTier;
  nichetags: string[];
  createdAt: Timestamp;
}

// Foundation profile type (different schema, used by foundation API)
export interface FoundationUserProfile {
  id: UserId;
  username: string;
  displayName: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  pronouns: string;
  website: string;
  location: string;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  premiumTier: PremiumTier;
  niches: string[];
  activityStatus: string;
  joinedAt: Timestamp;
}

// ===== MATCH =====
export interface MatchProfile {
  userId: UserId;
  profile: UserProfile;
  compatibilityScore: number;
  commonInterests: string[];
  distance: string | null;
}

// ===== MESSAGING =====
export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  text: string;
  mediaUrl: string | null;
  replyToId: MessageId | null;
  reactions: [UserId, string][];
  isRead: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Timestamp;
}

export interface Conversation {
  id: ConversationId;
  participants: UserId[];
  lastMessage: Message | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
}

// ===== CALL SIGNALING =====
export interface CallSignal {
  id: SignalId;
  fromId: UserId;
  toId: UserId;
  signalType: SignalType;
  payload: string; // JSON string (SDP or ICE candidate)
  createdAt: Timestamp;
}

// ===== NOTIFICATIONS =====
export interface Notification {
  id: NotificationId;
  userId: UserId;
  notifType: NotificationType;
  fromId: UserId;
  entityId: string | null;
  isRead: boolean;
  createdAt: Timestamp;
}

// ===== LIVE ROOMS =====
export interface LiveMessage {
  id: string;
  roomId: RoomId;
  senderId: UserId;
  text: string;
  createdAt: Timestamp;
}

export interface LiveRoom {
  id: RoomId;
  hostId: UserId;
  title: string;
  viewerCount: number;
  isActive: boolean;
  startedAt: Timestamp;
}

// ===== CREATOR ANALYTICS =====
export interface CreatorAnalytics {
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  weeklyGrowth: number;
  topVideos: VideoId[];
  earningsEstimate: number;
}

// ===== ACHIEVEMENTS =====
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp | null;
}

// ===== USER SETTINGS =====
export interface UserSettings {
  theme: "dark" | "light" | "auto";
  language: string;
  privacyMode: "public" | "private" | "friends";
  notificationsEnabled: boolean;
  autoplayEnabled: boolean;
  contentQuality: "auto" | "sd" | "hd";
  showActivityStatus: boolean;
  allowDMs: boolean;
  blockedUsers: UserId[];
}

// ===== PROFILE UPDATE FIELDS =====
export interface ProfileUpdateFields {
  username?: string;
  displayName?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  pronouns?: string;
  website?: string;
  location?: string;
  isPrivate?: boolean;
  niches?: string[];
  activityStatus?: string;
}

// ===== BACKEND RESULT =====
export type BackendResult<T> = { ok: T } | { err: string };

// ===== UI-SPECIFIC TYPES =====
export interface StoryGroup {
  userId: UserId;
  username: string;
  avatarUrl: string;
  stories: Story[];
  hasUnviewed: boolean;
  isOwn?: boolean;
}

export type Reaction = "❤️" | "😂" | "😮" | "😢" | "😡" | "🔥" | "🎉";
export type MediaType = "video" | "photo";

export interface UploadProgress {
  filename: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "done" | "error";
}

export interface MiniPlayerState {
  videoId: VideoId;
  url: string;
  thumbnailUrl: string;
  caption: string;
  creatorUsername: string;
  isPlaying: boolean;
}
