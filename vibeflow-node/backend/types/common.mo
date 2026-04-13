// types/common.mo — cross-cutting types shared across all domains
module {

  // Core identity
  public type UserId = Principal;
  public type Timestamp = Int; // nanoseconds since epoch (Time.now())

  // Generic paginated result for cursor-based pagination
  // T must be a shared type (no var fields, no mutable containers)
  public type PaginatedResult<T> = {
    items    : [T];
    nextCursor : ?Text;  // opaque cursor = last item's stable key
    hasMore  : Bool;
    total    : Nat;      // total count (may be approximate at scale)
  };

  // Standard result type
  public type Result<T, E> = { #ok : T; #err : E };
  public type SimpleResult = Result<Text, Text>;

};
