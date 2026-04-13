// Stub IDL factory for vibeflow_node_backend.
// This will be replaced by running `pnpm bindgen` from the project root.
// The actual candid interface is defined in vibeflow-node/backend/main.mo

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const idlFactory = ({ IDL }: { IDL: any }) => {
  // Shared types
  const UserId = IDL.Principal;
  const VideoId = IDL.Text;
  const StoryId = IDL.Text;
  const MessageId = IDL.Text;
  const ConversationId = IDL.Text;
  const NotificationId = IDL.Text;
  const SignalId = IDL.Text;
  const RoomId = IDL.Text;

  const PremiumTier = IDL.Variant({
    none: IDL.Null,
    fan: IDL.Null,
    creator: IDL.Null,
    vip: IDL.Null,
  });

  const VideoQuality = IDL.Variant({ hd: IDL.Null, sd: IDL.Null });

  const FeedType = IDL.Variant({
    forYou: IDL.Null,
    following: IDL.Null,
    trending: IDL.Null,
    popular: IDL.Null,
  });

  const Video = IDL.Record({
    id: VideoId,
    creatorId: UserId,
    url: IDL.Text,
    thumbnailUrl: IDL.Text,
    caption: IDL.Text,
    hashtags: IDL.Vec(IDL.Text),
    likesCount: IDL.Nat,
    commentsCount: IDL.Nat,
    sharesCount: IDL.Nat,
    bookmarksCount: IDL.Nat,
    viewsCount: IDL.Nat,
    duration: IDL.Nat,
    quality: VideoQuality,
    isLive: IDL.Bool,
    createdAt: IDL.Int,
  });

  const PaginatedVideo = IDL.Record({
    items: IDL.Vec(Video),
    nextCursor: IDL.Opt(IDL.Text),
    hasMore: IDL.Bool,
  });

  const UserProfile = IDL.Record({
    userId: UserId,
    username: IDL.Text,
    displayName: IDL.Text,
    bio: IDL.Text,
    avatarUrl: IDL.Text,
    coverUrl: IDL.Text,
    followerCount: IDL.Nat,
    followingCount: IDL.Nat,
    videoCount: IDL.Nat,
    isVerified: IDL.Bool,
    premiumTier: PremiumTier,
    nichetags: IDL.Vec(IDL.Text),
    createdAt: IDL.Int,
  });

  const StoryMediaType = IDL.Variant({ photo: IDL.Null, video: IDL.Null });
  const Story = IDL.Record({
    id: StoryId,
    authorId: UserId,
    mediaUrl: IDL.Text,
    mediaType: StoryMediaType,
    duration: IDL.Nat,
    expiresAt: IDL.Int,
    viewsCount: IDL.Nat,
    reactions: IDL.Vec(IDL.Tuple(UserId, IDL.Text)),
    poll: IDL.Opt(
      IDL.Record({
        question: IDL.Text,
        options: IDL.Vec(IDL.Text),
        votes: IDL.Vec(IDL.Tuple(UserId, IDL.Nat)),
      })
    ),
    createdAt: IDL.Int,
  });

  const Message = IDL.Record({
    id: MessageId,
    conversationId: ConversationId,
    senderId: UserId,
    text: IDL.Text,
    mediaUrl: IDL.Opt(IDL.Text),
    replyToId: IDL.Opt(MessageId),
    reactions: IDL.Vec(IDL.Tuple(UserId, IDL.Text)),
    isRead: IDL.Bool,
    isPinned: IDL.Bool,
    isDeleted: IDL.Bool,
    createdAt: IDL.Int,
  });

  const Conversation = IDL.Record({
    id: ConversationId,
    participants: IDL.Vec(UserId),
    lastMessage: IDL.Opt(Message),
    unreadCount: IDL.Nat,
    isPinned: IDL.Bool,
    isMuted: IDL.Bool,
    isArchived: IDL.Bool,
  });

  const SignalType = IDL.Variant({
    offer: IDL.Null,
    answer: IDL.Null,
    ice: IDL.Null,
    end: IDL.Null,
  });

  const CallSignal = IDL.Record({
    id: SignalId,
    fromId: UserId,
    toId: UserId,
    signalType: SignalType,
    payload: IDL.Text,
    createdAt: IDL.Int,
  });

  const NotificationType = IDL.Variant({
    like: IDL.Null,
    comment: IDL.Null,
    follow: IDL.Null,
    followRequest: IDL.Null,
    matchRequest: IDL.Null,
    matchAccepted: IDL.Null,
    mention: IDL.Null,
  });

  const Notification = IDL.Record({
    id: NotificationId,
    userId: UserId,
    notifType: NotificationType,
    fromId: UserId,
    entityId: IDL.Opt(IDL.Text),
    isRead: IDL.Bool,
    createdAt: IDL.Int,
  });

  const LiveRoom = IDL.Record({
    id: RoomId,
    hostId: UserId,
    title: IDL.Text,
    viewerCount: IDL.Nat,
    isActive: IDL.Bool,
    startedAt: IDL.Int,
  });

  const ResultText = IDL.Variant({ ok: IDL.Text, err: IDL.Text });

  return IDL.Service({
    // Foundation API
    getMyProfile: IDL.Func([], [IDL.Opt(UserProfile)], []),
    getProfile: IDL.Func([UserId], [IDL.Opt(UserProfile)], ["query"]),
    updateProfile: IDL.Func(
      [
        IDL.Record({
          username: IDL.Opt(IDL.Text),
          displayName: IDL.Opt(IDL.Text),
          avatar: IDL.Opt(IDL.Text),
          coverPhoto: IDL.Opt(IDL.Text),
          bio: IDL.Opt(IDL.Text),
          pronouns: IDL.Opt(IDL.Text),
          website: IDL.Opt(IDL.Text),
          location: IDL.Opt(IDL.Text),
          isPrivate: IDL.Opt(IDL.Bool),
          niches: IDL.Opt(IDL.Vec(IDL.Text)),
          activityStatus: IDL.Opt(IDL.Text),
        }),
      ],
      [ResultText],
      []
    ),
    followUser: IDL.Func([UserId], [ResultText], []),
    unfollowUser: IDL.Func([UserId], [ResultText], []),
    getFollowers: IDL.Func(
      [UserId, IDL.Opt(IDL.Text), IDL.Nat],
      [IDL.Record({ items: IDL.Vec(UserProfile), nextCursor: IDL.Opt(IDL.Text), hasMore: IDL.Bool })],
      ["query"]
    ),
    getFollowing: IDL.Func(
      [UserId, IDL.Opt(IDL.Text), IDL.Nat],
      [IDL.Record({ items: IDL.Vec(UserProfile), nextCursor: IDL.Opt(IDL.Text), hasMore: IDL.Bool })],
      ["query"]
    ),
    blockUser: IDL.Func([UserId], [ResultText], []),
    unblockUser: IDL.Func([UserId], [ResultText], []),
    getBlockedUsers: IDL.Func([], [IDL.Vec(UserId)], []),
    searchUsers: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text), IDL.Nat],
      [IDL.Record({ items: IDL.Vec(UserProfile), nextCursor: IDL.Opt(IDL.Text), hasMore: IDL.Bool })],
      ["query"]
    ),
    getSettings: IDL.Func([], [IDL.Record({
      theme: IDL.Text,
      language: IDL.Text,
      privacyMode: IDL.Text,
      notificationsEnabled: IDL.Bool,
      autoplayEnabled: IDL.Bool,
      contentQuality: IDL.Text,
      showActivityStatus: IDL.Bool,
      allowDMs: IDL.Bool,
      blockedUsers: IDL.Vec(UserId),
    })], []),
    updateSettings: IDL.Func([IDL.Record({
      theme: IDL.Text,
      language: IDL.Text,
      privacyMode: IDL.Text,
      notificationsEnabled: IDL.Bool,
      autoplayEnabled: IDL.Bool,
      contentQuality: IDL.Text,
      showActivityStatus: IDL.Bool,
      allowDMs: IDL.Bool,
      blockedUsers: IDL.Vec(UserId),
    })], [ResultText], []),

    // Social API
    postVideo: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Nat], [IDL.Variant({ ok: VideoId, err: IDL.Text })], []),
    getVideoFeed: IDL.Func([FeedType, IDL.Opt(IDL.Text), IDL.Nat], [PaginatedVideo], ["query"]),
    likeVideo: IDL.Func([VideoId], [], []),
    unlikeVideo: IDL.Func([VideoId], [], []),
    bookmarkVideo: IDL.Func([VideoId], [], []),
    unbookmarkVideo: IDL.Func([VideoId], [], []),
    getVideosByUser: IDL.Func([UserId, IDL.Opt(IDL.Text), IDL.Nat], [PaginatedVideo], ["query"]),
    getBookmarkedVideos: IDL.Func([IDL.Opt(IDL.Text), IDL.Nat], [PaginatedVideo], ["query"]),
    postStory: IDL.Func([IDL.Text, StoryMediaType, IDL.Nat], [IDL.Variant({ ok: StoryId, err: IDL.Text })], []),
    getStoriesByUser: IDL.Func([UserId], [IDL.Vec(Story)], ["query"]),
    viewStory: IDL.Func([StoryId], [], []),
    reactToStory: IDL.Func([StoryId, IDL.Text], [], []),
    getConversations: IDL.Func([], [IDL.Vec(Conversation)], []),
    getMessages: IDL.Func([ConversationId, IDL.Opt(IDL.Text), IDL.Nat], [IDL.Record({ items: IDL.Vec(Message), nextCursor: IDL.Opt(IDL.Text), hasMore: IDL.Bool })], []),
    sendMessage: IDL.Func([UserId, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(MessageId)], [IDL.Variant({ ok: MessageId, err: IDL.Text })], []),
    markConversationRead: IDL.Func([ConversationId], [], []),
    getNotifications: IDL.Func([IDL.Opt(IDL.Text), IDL.Nat], [IDL.Record({ items: IDL.Vec(Notification), nextCursor: IDL.Opt(IDL.Text), hasMore: IDL.Bool })], []),
    markNotificationRead: IDL.Func([NotificationId], [], []),
    markAllNotificationsRead: IDL.Func([], [], []),
    storeCallSignal: IDL.Func([UserId, SignalType, IDL.Text], [], []),
    getCallSignals: IDL.Func([], [IDL.Vec(CallSignal)], []),
    clearCallSignals: IDL.Func([], [], []),
    getMatchCandidates: IDL.Func([IDL.Opt(IDL.Text), IDL.Nat], [IDL.Record({ items: IDL.Vec(IDL.Record({ userId: UserId, profile: UserProfile, compatibilityScore: IDL.Nat, commonInterests: IDL.Vec(IDL.Text), distance: IDL.Opt(IDL.Text) })), nextCursor: IDL.Opt(IDL.Text), hasMore: IDL.Bool })], []),
    swipeRight: IDL.Func([UserId], [IDL.Variant({ ok: IDL.Bool, err: IDL.Text })], []),
    swipeLeft: IDL.Func([UserId], [], []),
    getMatches: IDL.Func([], [IDL.Vec(UserProfile)], []),
    sendMatchRequest: IDL.Func([UserId], [ResultText], []),
    acceptMatchRequest: IDL.Func([UserId], [ResultText], []),
    declineMatchRequest: IDL.Func([UserId], [ResultText], []),
    getLiveRooms: IDL.Func([], [IDL.Vec(LiveRoom)], ["query"]),
    createLiveRoom: IDL.Func([IDL.Text], [IDL.Variant({ ok: RoomId, err: IDL.Text })], []),
    joinLiveRoom: IDL.Func([RoomId], [ResultText], []),
    leaveLiveRoom: IDL.Func([RoomId], [], []),
    sendLiveMessage: IDL.Func([RoomId, IDL.Text], [], []),
    getLiveMessages: IDL.Func([RoomId], [IDL.Vec(IDL.Record({ id: IDL.Text, roomId: RoomId, senderId: UserId, text: IDL.Text, createdAt: IDL.Int }))], []),
    getCreatorAnalytics: IDL.Func([], [IDL.Record({ totalViews: IDL.Nat, totalLikes: IDL.Nat, totalFollowers: IDL.Nat, weeklyGrowth: IDL.Nat, topVideos: IDL.Vec(VideoId), earningsEstimate: IDL.Float64 })], []),
    getAchievements: IDL.Func([], [IDL.Vec(IDL.Record({ id: IDL.Text, name: IDL.Text, description: IDL.Text, icon: IDL.Text, unlockedAt: IDL.Opt(IDL.Int) }))], ["query"]),
    getVideosByHashtag: IDL.Func([IDL.Text, IDL.Opt(IDL.Text), IDL.Nat], [PaginatedVideo], ["query"]),
    getTrendingHashtags: IDL.Func([], [IDL.Vec(IDL.Record({ tag: IDL.Text, count: IDL.Nat }))], ["query"]),
  });
};

export const canisterId = (import.meta.env.VITE_CANISTER_ID_VIBEFLOW_NODE_BACKEND as string) ?? "";
