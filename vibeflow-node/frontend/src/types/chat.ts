export type DeliveryStatus = "sending" | "sent" | "delivered" | "seen";
export type MessageType = "text" | "image" | "video" | "audio" | "voice";

export interface MessageReaction {
  emoji: string;
  userId: string;
  username: string;
}

export interface ReplyTo {
  messageId: string;
  senderName: string;
  text: string;
  mediaUrl?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: MessageType;
  deliveryStatus: DeliveryStatus;
  reactions: MessageReaction[];
  replyTo?: ReplyTo;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantIsOnline: boolean;
  lastActiveAt: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  isTyping: boolean;
}

export type NotificationType = "like" | "comment" | "follow" | "match" | "follow_request" | "mention" | "duet";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  entityId?: string;
  entityThumbnail?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  requiresAction?: boolean;
  actionTaken?: "accepted" | "declined" | "followed_back";
}

export interface CallSignal {
  type: "offer" | "answer" | "ice" | "end";
  from: string;
  to: string;
  payload: string;
  createdAt: string;
}

export type CallState = "idle" | "outgoing" | "incoming" | "active";

export interface CallSession {
  state: CallState;
  callType: "video" | "audio";
  remoteUserId: string;
  remoteUserName: string;
  remoteUserAvatar: string;
  startedAt?: number;
}
