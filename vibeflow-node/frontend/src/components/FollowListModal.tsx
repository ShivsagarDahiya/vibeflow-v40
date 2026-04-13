import { X, UserCheck, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFollowers, useFollowing } from "../hooks/useProfile";

interface Props {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}

export default function FollowListModal({ userId, type, onClose }: Props) {
  const navigate = useNavigate();
  const followersQuery = useFollowers(type === "followers" ? userId : "");
  const followingQuery = useFollowing(type === "following" ? userId : "");

  const query = type === "followers" ? followersQuery : followingQuery;
  const users = query.data ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={type === "followers" ? "Followers" : "Following"}
    >
      <button
        type="button"
        className="absolute inset-0 bg-dark/80 backdrop-blur-sm w-full"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl max-h-[70dvh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-white capitalize">{type}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-surface-higher flex items-center justify-center text-white/60 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          {query.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 rounded skeleton" />
                    <div className="h-3 w-16 rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-high transition-colors text-left"
                  onClick={() => { navigate(`/user/${user.id}`); onClose(); }}
                  data-ocid={`follow-list-user-${user.id}`}
                >
                  <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{user.displayName}</div>
                    <div className="text-xs text-white/50 truncate">@{user.username}</div>
                  </div>
                  {user.isFollowing ? (
                    <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-white/30 flex-shrink-0" />
                  )}
                </button>
              ))}
              {!users.length && (
                <div className="p-8 text-center text-white/30 text-sm">No {type} yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
