import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { SkeletonLoader } from "@/components/SkeletonLoader";

/**
 * UserPage — public profile view for any user by ID.
 * Full implementation will be done in the next wave.
 */
export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-hide"
      style={{ background: "var(--color-dark)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 pt-safe flex-shrink-0"
        style={{ background: "var(--color-surface)" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-white font-semibold text-base">Profile</span>
        <button
          type="button"
          aria-label="More options"
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <MoreVertical size={22} />
        </button>
      </div>

      {/* Skeleton while loading */}
      <div className="flex-1" data-ocid={`user-profile-${id}`}>
        <SkeletonLoader variant="profile-card" />
        <div className="px-4 mt-4">
          <SkeletonLoader variant="video-card" />
        </div>
      </div>
    </div>
  );
}
