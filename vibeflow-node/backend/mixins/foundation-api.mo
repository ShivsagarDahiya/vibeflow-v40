// mixins/foundation-api.mo — public API endpoints for the foundation domain
//
// State injected:
//   profiles     : Map<UserId, UserProfileInternal>
//   settings     : Map<UserId, UserSettingsInternal>
//   followers    : Map<UserId, List<FollowRecord>>   (followee -> list of followers)
//   following    : Map<UserId, List<FollowRecord>>   (follower -> list of followees)
//   blockedUsers : Map<UserId, Set<UserId>>          (blocker -> set of blocked)
//
import Types   "../types/foundation";
import Common  "../types/common";
import Lib     "../lib/foundation";
import Map     "mo:core/Map";
import List    "mo:core/List";
import Set     "mo:core/Set";
import Runtime "mo:core/Runtime";

mixin (
  profiles     : Map.Map<Types.UserId, Types.UserProfileInternal>,
  settings     : Map.Map<Types.UserId, Types.UserSettingsInternal>,
  followers    : Map.Map<Types.UserId, List.List<Types.FollowRecord>>,
  following    : Map.Map<Types.UserId, List.List<Types.FollowRecord>>,
  blockedUsers : Map.Map<Types.UserId, Set.Set<Types.UserId>>
) {

  // ── Profile ──────────────────────────────────────────────────────────────────

  /// Returns the caller's profile, auto-creating it on first call
  public shared ({ caller }) func getMyProfile() : async ?Types.UserProfile {
    Runtime.trap("not implemented");
  };

  /// Returns any user's public profile by id
  public query func getProfile(userId : Types.UserId) : async ?Types.UserProfile {
    Runtime.trap("not implemented");
  };

  /// Update the caller's own profile fields (partial update)
  public shared ({ caller }) func updateProfile(
    fields : Types.ProfileUpdateFields
  ) : async Common.SimpleResult {
    Runtime.trap("not implemented");
  };

  // ── Settings ──────────────────────────────────────────────────────────────────

  /// Returns the caller's settings, creating defaults if first visit
  public shared ({ caller }) func getSettings() : async Types.UserSettings {
    Runtime.trap("not implemented");
  };

  /// Persist a full settings object for the caller
  public shared ({ caller }) func updateSettings(
    newSettings : Types.UserSettings
  ) : async Common.SimpleResult {
    Runtime.trap("not implemented");
  };

  // ── Follow ────────────────────────────────────────────────────────────────────

  /// Follow another user; idempotent
  public shared ({ caller }) func followUser(
    targetId : Types.UserId
  ) : async Common.SimpleResult {
    Runtime.trap("not implemented");
  };

  /// Unfollow another user; idempotent
  public shared ({ caller }) func unfollowUser(
    targetId : Types.UserId
  ) : async Common.SimpleResult {
    Runtime.trap("not implemented");
  };

  /// Paginated list of a user's followers (20 per page max)
  public query func getFollowers(
    userId : Types.UserId,
    cursor : ?Text,
    limit  : Nat
  ) : async Common.PaginatedResult<Types.UserProfile> {
    Runtime.trap("not implemented");
  };

  /// Paginated list of users a given user is following (20 per page max)
  public query func getFollowing(
    userId : Types.UserId,
    cursor : ?Text,
    limit  : Nat
  ) : async Common.PaginatedResult<Types.UserProfile> {
    Runtime.trap("not implemented");
  };

  // ── Block ─────────────────────────────────────────────────────────────────────

  /// Block a user; also removes any follow relationship
  public shared ({ caller }) func blockUser(
    targetId : Types.UserId
  ) : async Common.SimpleResult {
    Runtime.trap("not implemented");
  };

  /// Unblock a user
  public shared ({ caller }) func unblockUser(
    targetId : Types.UserId
  ) : async Common.SimpleResult {
    Runtime.trap("not implemented");
  };

  /// Returns the full list of users blocked by the caller
  public shared ({ caller }) func getBlockedUsers() : async [Types.UserId] {
    Runtime.trap("not implemented");
  };

  // ── Search ────────────────────────────────────────────────────────────────────

  /// Full-text substring search across username and displayName (paginated)
  public query func searchUsers(
    query  : Text,
    cursor : ?Text,
    limit  : Nat
  ) : async Common.PaginatedResult<Types.UserProfile> {
    Runtime.trap("not implemented");
  };

};
