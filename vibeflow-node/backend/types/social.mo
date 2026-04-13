import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {

  // ===== SHARED ID TYPES =====
  public type UserId = Principal;
  public type VideoId = Text;
  public type CommentId = Text;
  public type StoryId = Text;
  public type MessageId = Text;
  public type ConversationId = Text;
  public type NotificationId = Text;
  public type SignalId = Text;
  public type RoomId = Text;

  // ===== PAGINATION =====
  public type PaginatedResult<T> = {
    items : [T];
    nextCursor : ?Text;
    hasMore : Bool;
  };

  // ===== RESULT =====
  public type Result<T> = { #ok : T; #err : Text };

  // ===== VIDEO =====
  public type FeedType = {
    #forYou;
    #following;
    #trending;
    #popular;
  };

  public type VideoQuality = { #hd; #sd };

  public type Video = {
    id : VideoId;
    creatorId : UserId;
    url : Text;
    thumbnailUrl : Text;
    caption : Text;
    hashtags : [Text];
    likesCount : Nat;
    commentsCount : Nat;
    sharesCount : Nat;
    bookmarksCount : Nat;
    viewsCount : Nat;
    duration : Nat;
    quality : VideoQuality;
    isLive : Bool;
    createdAt : Time.Time;
  };

  // ===== COMMENT =====
  public type Comment = {
    id : CommentId;
    videoId : VideoId;
    authorId : UserId;
    text : Text;
    likesCount : Nat;
    parentId : ?CommentId;
    repliesCount : Nat;
    createdAt : Time.Time;
  };

  // ===== STORY =====
  public type StoryMediaType = { #photo; #video };

  public type StoryPoll = {
    question : Text;
    options : [Text];
    votes : [(UserId, Nat)];
  };

  public type Story = {
    id : StoryId;
    authorId : UserId;
    mediaUrl : Text;
    mediaType : StoryMediaType;
    duration : Nat;
    expiresAt : Time.Time;
    viewsCount : Nat;
    reactions : [(UserId, Text)];
    poll : ?StoryPoll;
    createdAt : Time.Time;
  };

  // ===== MATCH =====
  public type UserProfile = {
    userId : UserId;
    username : Text;
    displayName : Text;
    bio : Text;
    avatarUrl : Text;
    coverUrl : Text;
    followerCount : Nat;
    followingCount : Nat;
    videoCount : Nat;
    isVerified : Bool;
    premiumTier : PremiumTier;
    nichetags : [Text];
    createdAt : Time.Time;
  };

  public type MatchProfile = {
    userId : UserId;
    profile : UserProfile;
    compatibilityScore : Nat;
    commonInterests : [Text];
    distance : ?Text;
  };

  // ===== MESSAGING =====
  public type Message = {
    id : MessageId;
    conversationId : ConversationId;
    senderId : UserId;
    text : Text;
    mediaUrl : ?Text;
    replyToId : ?MessageId;
    reactions : [(UserId, Text)];
    isRead : Bool;
    isPinned : Bool;
    isDeleted : Bool;
    createdAt : Time.Time;
  };

  public type Conversation = {
    id : ConversationId;
    participants : [UserId];
    lastMessage : ?Message;
    unreadCount : Nat;
    isPinned : Bool;
    isMuted : Bool;
    isArchived : Bool;
  };

  // ===== CALL SIGNALING =====
  public type SignalType = { #offer; #answer; #ice; #end };

  public type CallSignal = {
    id : SignalId;
    fromId : UserId;
    toId : UserId;
    signalType : SignalType;
    payload : Text;
    createdAt : Time.Time;
  };

  // ===== NOTIFICATIONS =====
  public type NotificationType = {
    #like;
    #comment;
    #follow;
    #followRequest;
    #matchRequest;
    #matchAccepted;
    #mention;
  };

  public type Notification = {
    id : NotificationId;
    userId : UserId;
    notifType : NotificationType;
    fromId : UserId;
    entityId : ?Text;
    isRead : Bool;
    createdAt : Time.Time;
  };

  // ===== LIVE ROOMS =====
  public type LiveMessage = {
    id : Text;
    roomId : RoomId;
    senderId : UserId;
    text : Text;
    createdAt : Time.Time;
  };

  public type LiveRoom = {
    id : RoomId;
    hostId : UserId;
    title : Text;
    viewerCount : Nat;
    isActive : Bool;
    startedAt : Time.Time;
  };

  // ===== ANALYTICS =====
  public type CreatorAnalytics = {
    totalViews : Nat;
    totalLikes : Nat;
    totalFollowers : Nat;
    weeklyGrowth : Nat;
    topVideos : [VideoId];
    earningsEstimate : Float;
  };

  // ===== PREMIUM =====
  public type PremiumTier = { #none; #fan; #creator; #vip };

  // ===== ACHIEVEMENTS =====
  public type Achievement = {
    id : Text;
    name : Text;
    description : Text;
    icon : Text;
    unlockedAt : ?Time.Time;
  };

  // ===== INTERNAL STATE TYPES (not shared across API) =====
  public type VideoInternal = {
    id : VideoId;
    creatorId : UserId;
    url : Text;
    thumbnailUrl : Text;
    caption : Text;
    hashtags : [Text];
    var likesCount : Nat;
    var commentsCount : Nat;
    var sharesCount : Nat;
    var bookmarksCount : Nat;
    var viewsCount : Nat;
    duration : Nat;
    quality : VideoQuality;
    isLive : Bool;
    createdAt : Time.Time;
  };

  public type CommentInternal = {
    id : CommentId;
    videoId : VideoId;
    authorId : UserId;
    text : Text;
    var likesCount : Nat;
    parentId : ?CommentId;
    var repliesCount : Nat;
    isDeleted : Bool;
    createdAt : Time.Time;
  };

  public type StoryInternal = {
    id : StoryId;
    authorId : UserId;
    mediaUrl : Text;
    mediaType : StoryMediaType;
    duration : Nat;
    expiresAt : Time.Time;
    var viewsCount : Nat;
    var reactions : [(UserId, Text)];
    poll : ?StoryPoll;
    createdAt : Time.Time;
  };

  public type MessageInternal = {
    id : MessageId;
    conversationId : ConversationId;
    senderId : UserId;
    text : Text;
    mediaUrl : ?Text;
    replyToId : ?MessageId;
    var reactions : [(UserId, Text)];
    var isRead : Bool;
    var isPinned : Bool;
    var isDeleted : Bool;
    createdAt : Time.Time;
  };

  public type ConversationInternal = {
    id : ConversationId;
    participants : [UserId];
    var lastMessageId : ?MessageId;
    var unreadCount : Nat;
    var isPinned : Bool;
    var isMuted : Bool;
    var isArchived : Bool;
  };

  public type LiveRoomInternal = {
    id : RoomId;
    hostId : UserId;
    title : Text;
    var viewerCount : Nat;
    var isActive : Bool;
    var viewers : [UserId];
    startedAt : Time.Time;
  };

  public type MatchState = {
    user1 : UserId;
    user2 : UserId;
    createdAt : Time.Time;
  };

  public type NotificationInternal = {
    id : NotificationId;
    userId : UserId;
    notifType : NotificationType;
    fromId : UserId;
    entityId : ?Text;
    var isRead : Bool;
    createdAt : Time.Time;
  };

  public type UserProfileInternal = {
    userId : UserId;
    var username : Text;
    var displayName : Text;
    var bio : Text;
    var avatarUrl : Text;
    var coverUrl : Text;
    var nichetagsList : [Text];
    var premiumTier : PremiumTier;
    createdAt : Time.Time;
  };

  public type CallSignalInternal = {
    id : SignalId;
    fromId : UserId;
    toId : UserId;
    signalType : SignalType;
    payload : Text;
    createdAt : Time.Time;
  };

};
