// main.mo — composition root for the VibeFlow Node canister
//
// This file owns all stable state and wires mixins together.
// NO business logic lives here — all logic lives in lib/ and mixins/.
//
import FoundationTypes  "types/foundation";
import SocialTypes      "types/social";
import FoundationAPI    "mixins/foundation-api";
import SocialAPI        "mixins/social-api";
import Map              "mo:core/Map";
import List             "mo:core/List";
import Set              "mo:core/Set";
import AccessControl    "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";

actor {

  // ── Platform extension state ───────────────────────────────────────────────────

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinObjectStorage();

  // ── Stable state — foundation domain ─────────────────────────────────────────

  let profiles     = Map.empty<FoundationTypes.UserId, FoundationTypes.UserProfileInternal>();
  let settings     = Map.empty<FoundationTypes.UserId, FoundationTypes.UserSettingsInternal>();
  let followers    = Map.empty<FoundationTypes.UserId, List.List<FoundationTypes.FollowRecord>>();
  let following    = Map.empty<FoundationTypes.UserId, List.List<FoundationTypes.FollowRecord>>();
  let blockedUsers = Map.empty<FoundationTypes.UserId, Set.Set<FoundationTypes.UserId>>();

  // ── Stable state — social domain ──────────────────────────────────────────────

  let videos          = Map.empty<SocialTypes.VideoId, SocialTypes.VideoInternal>();
  let videoLikes      = Map.empty<SocialTypes.VideoId, Set.Set<SocialTypes.UserId>>();
  let videoBookmarks  = Map.empty<SocialTypes.VideoId, Set.Set<SocialTypes.UserId>>();
  let comments        = Map.empty<SocialTypes.CommentId, SocialTypes.CommentInternal>();
  let commentLikes    = Map.empty<SocialTypes.CommentId, Set.Set<SocialTypes.UserId>>();
  let stories         = Map.empty<SocialTypes.StoryId, SocialTypes.StoryInternal>();
  let storyViews      = Map.empty<SocialTypes.StoryId, Set.Set<SocialTypes.UserId>>();
  let messages        = Map.empty<SocialTypes.MessageId, SocialTypes.MessageInternal>();
  let conversations   = Map.empty<SocialTypes.ConversationId, SocialTypes.ConversationInternal>();
  let typingStatus    = Map.empty<SocialTypes.ConversationId, Set.Set<SocialTypes.UserId>>();
  let matches         = Map.empty<Text, SocialTypes.MatchState>();
  let matchRequests   = Map.empty<Text, SocialTypes.UserId>();
  let swipedRight     = Map.empty<SocialTypes.UserId, Set.Set<SocialTypes.UserId>>();
  let swipedLeft      = Map.empty<SocialTypes.UserId, Set.Set<SocialTypes.UserId>>();
  let callSignals     = Map.empty<SocialTypes.SignalId, SocialTypes.CallSignalInternal>();
  let notifications   = Map.empty<SocialTypes.NotificationId, SocialTypes.NotificationInternal>();
  let liveRooms       = Map.empty<SocialTypes.RoomId, SocialTypes.LiveRoomInternal>();
  let liveMsgs        = Map.empty<Text, SocialTypes.LiveMessage>();
  let socialProfiles  = Map.empty<SocialTypes.UserId, SocialTypes.UserProfileInternal>();
  let socialFollowing = Map.empty<SocialTypes.UserId, Set.Set<SocialTypes.UserId>>();
  let premiumTiers    = Map.empty<SocialTypes.UserId, SocialTypes.PremiumTier>();

  let videoCounter    = { var n : Nat = 0 };
  let commentCounter  = { var n : Nat = 0 };
  let storyCounter    = { var n : Nat = 0 };
  let messageCounter  = { var n : Nat = 0 };
  let signalCounter   = { var n : Nat = 0 };
  let notifCounter    = { var n : Nat = 0 };
  let roomCounter     = { var n : Nat = 0 };
  let liveMsgCounter  = { var n : Nat = 0 };

  // ── Mixin inclusion ───────────────────────────────────────────────────────────

  include FoundationAPI(profiles, settings, followers, following, blockedUsers);

  include SocialAPI(
    videos, videoLikes, videoBookmarks,
    comments, commentLikes,
    stories, storyViews,
    messages, conversations, typingStatus,
    matches, matchRequests, swipedRight, swipedLeft,
    callSignals,
    notifications,
    liveRooms, liveMsgs,
    socialProfiles, socialFollowing, premiumTiers,
    videoCounter, commentCounter, storyCounter, messageCounter,
    signalCounter, notifCounter, roomCounter, liveMsgCounter,
  );

};
