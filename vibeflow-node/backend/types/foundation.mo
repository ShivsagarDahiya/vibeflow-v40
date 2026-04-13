// types/foundation.mo — foundation domain: users, profiles, settings, follows, blocks
import Common "common";

module {

  public type UserId    = Common.UserId;
  public type Timestamp = Common.Timestamp;

  // Premium tier enum
  public type PremiumTier = {
    #None;
    #Fan;
    #Creator;
    #VIP;
  };

  // Public-facing UserProfile (shared type — no var fields)
  public type UserProfile = {
    id             : UserId;
    username       : Text;
    displayName    : Text;
    avatar         : Text;   // object-storage URL or ""
    coverPhoto     : Text;   // object-storage URL or ""
    bio            : Text;
    pronouns       : Text;
    website        : Text;
    location       : Text;
    followersCount : Nat;
    followingCount : Nat;
    videosCount    : Nat;
    isPrivate      : Bool;
    isVerified     : Bool;
    premiumTier    : PremiumTier;
    niches         : [Text];
    activityStatus : Text;   // "online" | "offline" | "Active Xh ago"
    joinedAt       : Timestamp;
  };

  // Internal mutable profile (used in actor state)
  public type UserProfileInternal = {
    id             : UserId;
    var username       : Text;
    var displayName    : Text;
    var avatar         : Text;
    var coverPhoto     : Text;
    var bio            : Text;
    var pronouns       : Text;
    var website        : Text;
    var location       : Text;
    var followersCount : Nat;
    var followingCount : Nat;
    var videosCount    : Nat;
    var isPrivate      : Bool;
    var isVerified     : Bool;
    var premiumTier    : PremiumTier;
    var niches         : [Text];
    var activityStatus : Text;
    joinedAt       : Timestamp;
  };

  // Fields caller can supply when updating their profile
  public type ProfileUpdateFields = {
    username       : ?Text;
    displayName    : ?Text;
    avatar         : ?Text;
    coverPhoto     : ?Text;
    bio            : ?Text;
    pronouns       : ?Text;
    website        : ?Text;
    location       : ?Text;
    isPrivate      : ?Bool;
    niches         : ?[Text];
    activityStatus : ?Text;
  };

  // User settings (shared type — no var fields)
  public type UserSettings = {
    theme              : Text;   // "dark" | "light" | "auto"
    language           : Text;   // ISO 639-1 code, e.g. "en"
    privacyMode        : Text;   // "public" | "private" | "friends"
    notificationsEnabled : Bool;
    autoplayEnabled    : Bool;
    contentQuality     : Text;   // "auto" | "sd" | "hd"
    showActivityStatus : Bool;
    allowDMs           : Bool;
    blockedUsers       : [UserId];
  };

  // Internal mutable settings
  public type UserSettingsInternal = {
    var theme              : Text;
    var language           : Text;
    var privacyMode        : Text;
    var notificationsEnabled : Bool;
    var autoplayEnabled    : Bool;
    var contentQuality     : Text;
    var showActivityStatus : Bool;
    var allowDMs           : Bool;
    // blocked users stored in the separate blockedUsers map
  };

  // Follow relationship record
  public type FollowRecord = {
    follower  : UserId;
    followee  : UserId;
    createdAt : Timestamp;
  };

  // Block record
  public type BlockRecord = {
    blocker   : UserId;
    blocked   : UserId;
    createdAt : Timestamp;
  };

};
