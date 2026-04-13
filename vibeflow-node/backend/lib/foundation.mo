// lib/foundation.mo — domain logic for users, profiles, settings, follows, blocks
import Types    "../types/foundation";
import Common   "../types/common";
import Map      "mo:core/Map";
import List     "mo:core/List";
import Set      "mo:core/Set";
import Time     "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime  "mo:core/Runtime";

module {

  // ── Type aliases ────────────────────────────────────────────────────────────

  public type UserId            = Types.UserId;
  public type UserProfile       = Types.UserProfile;
  public type UserProfileInternal = Types.UserProfileInternal;
  public type ProfileUpdateFields = Types.ProfileUpdateFields;
  public type UserSettings      = Types.UserSettings;
  public type UserSettingsInternal = Types.UserSettingsInternal;
  public type FollowRecord      = Types.FollowRecord;
  public type PaginatedResult<T> = Common.PaginatedResult<T>;
  public type SimpleResult      = Common.SimpleResult;

  // ── Max page size guard ──────────────────────────────────────────────────────

  public let MAX_PAGE_SIZE : Nat = 20;

  // ── Profile helpers ──────────────────────────────────────────────────────────

  /// Create a brand-new profile for a first-time caller
  public func newProfile(id : UserId, username : Text) : UserProfileInternal {
    Runtime.trap("not implemented");
  };

  /// Project an internal mutable profile to the public shared type
  public func toPublicProfile(
    self        : UserProfileInternal,
    blockedSet  : Set.Set<UserId>
  ) : UserProfile {
    Runtime.trap("not implemented");
  };

  /// Apply a partial update to an existing mutable profile
  public func applyProfileUpdate(
    self   : UserProfileInternal,
    fields : ProfileUpdateFields
  ) : SimpleResult {
    Runtime.trap("not implemented");
  };

  // ── Settings helpers ─────────────────────────────────────────────────────────

  /// Default settings for a new user
  public func defaultSettings() : UserSettingsInternal {
    Runtime.trap("not implemented");
  };

  /// Project internal settings + blocked list to the public type
  public func toPublicSettings(
    self     : UserSettingsInternal,
    blocked  : [UserId]
  ) : UserSettings {
    Runtime.trap("not implemented");
  };

  // ── Follow logic ─────────────────────────────────────────────────────────────

  /// Validate that caller can follow target (not blocked, not self)
  public func canFollow(
    caller    : UserId,
    target    : UserId,
    blockedBy : Set.Set<UserId>  // people who blocked caller
  ) : Bool {
    Runtime.trap("not implemented");
  };

  // ── Cursor-based pagination ──────────────────────────────────────────────────

  /// Clamp limit to MAX_PAGE_SIZE
  public func clampLimit(requested : Nat) : Nat {
    Runtime.trap("not implemented");
  };

  /// Paginate a flat array using an opaque text cursor (= Principal.toText of last item)
  /// Returns (page, nextCursor)
  public func paginateProfiles(
    items     : [UserProfile],
    cursor    : ?Text,
    limit     : Nat
  ) : PaginatedResult<UserProfile> {
    Runtime.trap("not implemented");
  };

  /// Generic paginator over Text-keyed items; key extractor provided by caller
  public func paginateText<T>(
    items    : [T],
    keyOf    : T -> Text,
    cursor   : ?Text,
    limit    : Nat,
    total    : Nat
  ) : PaginatedResult<T> {
    Runtime.trap("not implemented");
  };

  // ── Search helpers ───────────────────────────────────────────────────────────

  /// Case-insensitive substring search on username and displayName
  public func matchesQuery(profile : UserProfile, query : Text) : Bool {
    Runtime.trap("not implemented");
  };

};
