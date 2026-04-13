import type { VideoCard, UserCard } from "../types/explore";
import { formatCount } from "../lib/format";
import { Play, Eye } from "lucide-react";

interface Props {
  video: VideoCard;
  onClick?: () => void;
}

export function VideoThumbnailCard({ video, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group w-full aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      data-ocid="video-thumb-card"
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      {/* View count */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium">
        <Eye className="w-3 h-3" />
        <span>{formatCount(video.viewsCount)}</span>
      </div>
      {/* Duration */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
        {formatDuration(video.duration)}
      </div>
      {/* Play on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
    </button>
  );
}

interface UserCardProps {
  user: UserCard;
  onFollow?: (id: string) => void;
  rank?: number;
}

export function UserAvatarCard({ user, onFollow, rank }: UserCardProps) {
  return (
    <div
      className="flex-shrink-0 w-32 flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
      data-ocid="creator-card"
    >
      <div className="relative">
        {rank === 1 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-black z-10">
            👑
          </div>
        )}
        <img
          src={user.avatar}
          alt={user.displayName}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-rose-500/40"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-white text-xs font-semibold truncate">{user.displayName}</p>
        <p className="text-zinc-400 text-xs">{formatCount(user.followerCount)}</p>
      </div>
      <button
        type="button"
        onClick={() => onFollow?.(user.id)}
        className="w-full py-1 rounded-full text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors"
        data-ocid="follow-btn"
      >
        {user.isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
