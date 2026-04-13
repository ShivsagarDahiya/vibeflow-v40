import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle,
  Crown,
  MessageCircle,
  UserPlus,
  UserCheck,
  Grid3x3,
  Heart,
  Bookmark,
  Users2,
  Play,
  Share2,
  Star,
  Zap,
} from "lucide-react";
import {
  useUserProfile,
  useHighlights,
  useUserVideos,
  useFollowUser,
} from "../hooks/useProfile";
import { formatCount } from "../lib/format";
import QRShareModal from "../components/QRShareModal";
import PremiumUpgradeSheet from "../components/PremiumUpgradeSheet";
import FollowListModal from "../components/FollowListModal";
import type { PremiumTier } from "../hooks/useProfile";

type ContentTab = "videos" | "liked" | "saved" | "duets";

const CONTENT_TABS = [
  { id: "videos" as ContentTab, icon: <Grid3x3 className="w-4 h-4" /> },
  { id: "liked" as ContentTab, icon: <Heart className="w-4 h-4" /> },
  { id: "saved" as ContentTab, icon: <Bookmark className="w-4 h-4" /> },
  { id: "duets" as ContentTab, icon: <Users2 className="w-4 h-4" /> },
];

function VideoGrid({ userId, tab }: { userId: string; tab: ContentTab }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserVideos(userId, tab);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const videos = data?.pages.flatMap((p) => p.videos) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-[9/16] skeleton" />
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30" data-ocid="empty-videos">
        <div className="text-4xl mb-3">📹</div>
        <div className="text-sm">No {tab} videos yet</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-0.5">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            className="relative aspect-[9/16] overflow-hidden group"
            data-ocid="user-video-thumb"
          >
            <img src={v.thumbnailUrl} alt="Video" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-xs">
              <Play className="w-3 h-3 fill-white" />
              <span>{formatCount(v.viewsCount)}</span>
            </div>
          </button>
        ))}
      </div>
      <div ref={sentinelRef} className="h-8 flex items-center justify-center">
        {isFetchingNextPage && <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
      </div>
    </div>
  );
}

function SubscribeTierPill({ tier, onClick }: { tier: PremiumTier; onClick: () => void }) {
  const tierConfig = {
    fan: { label: "Fan", icon: <Star className="w-3 h-3" />, class: "text-primary border-primary/40" },
    creator: { label: "Creator", icon: <Zap className="w-3 h-3" />, class: "text-gold border-gold/40" },
    vip: { label: "VIP", icon: <Crown className="w-3 h-3" />, class: "text-gold border-gold/50 bg-gold/10" },
  };
  if (tier === "free") return null;
  const cfg = tierConfig[tier];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 rounded-full ${cfg.class}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function UserProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>("videos");
  const [showQR, setShowQR] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

  const { data: profile, isLoading } = useUserProfile(id);
  const { data: highlights } = useHighlights(id);
  const followMutation = useFollowUser();

  const handleFollow = useCallback(() => {
    if (!profile) return;
    followMutation.mutate({ userId: profile.id, follow: !profile.isFollowing });
  }, [profile, followMutation]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab">
        <div className="h-52 skeleton" />
        <div className="flex flex-col items-center -mt-12 gap-3 px-4 pb-4">
          <div className="w-24 h-24 rounded-full skeleton ring-4 ring-dark" />
          <div className="w-32 h-5 rounded skeleton" />
          <div className="w-48 h-4 rounded skeleton" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-white/30">
        <div className="text-4xl mb-3">👤</div>
        <p>User not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab" data-ocid="user-profile-page">
        {/* Cover */}
        <div className="relative h-52 flex-shrink-0">
          {profile.coverPhotoUrl ? (
            <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-300 via-primary/20 to-dark-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent" />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-12 left-4 w-9 h-9 rounded-full glass-dark flex items-center justify-center text-white"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="absolute top-12 right-4 w-9 h-9 rounded-full glass-dark flex items-center justify-center text-white/80"
            aria-label="Share"
            data-ocid="user-share-btn"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar + info */}
        <div className="flex flex-col items-center -mt-14 px-4 pb-4">
          <div className={`relative mb-3 ${profile.tier === "vip" ? "vip-ring p-0.5" : profile.tier !== "free" ? "story-ring p-0.5" : ""}`}>
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-dark">
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            </div>
            {profile.tier === "vip" && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full btn-gold flex items-center justify-center shadow-gold">
                <Crown className="w-4 h-4 text-dark" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-display font-semibold text-white">{profile.displayName}</h1>
            {profile.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />}
            <SubscribeTierPill tier={profile.tier} onClick={() => setShowSubscribe(true)} />
          </div>
          <div className="text-white/50 text-sm mb-2">@{profile.username}</div>

          {profile.bio && (
            <p className="text-white/70 text-sm text-center max-w-xs line-clamp-3 mb-3">{profile.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-base font-bold text-white">{formatCount(profile.videoCount)}</div>
              <div className="text-xs text-white/50">Videos</div>
            </div>
            <button type="button" onClick={() => setFollowListType("followers")} className="text-center hover:opacity-80" data-ocid="user-followers">
              <div className="text-base font-bold text-white">{formatCount(profile.followerCount)}</div>
              <div className="text-xs text-white/50">Followers</div>
            </button>
            <button type="button" onClick={() => setFollowListType("following")} className="text-center hover:opacity-80" data-ocid="user-following">
              <div className="text-base font-bold text-white">{formatCount(profile.followingCount)}</div>
              <div className="text-xs text-white/50">Following</div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={handleFollow}
              disabled={followMutation.isPending}
              data-ocid="follow-btn"
              className={`flex-1 h-10 rounded-full font-semibold text-sm flex items-center justify-center gap-1.5 transition-smooth disabled:opacity-50 ${
                profile.isFollowing
                  ? "bg-surface-higher border border-white/15 text-white"
                  : "btn-love"
              }`}
            >
              {profile.isFollowing ? (
                <><UserCheck className="w-4 h-4" /> Following</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Follow</>
              )}
            </button>

            {profile.isMatched && (
              <button
                type="button"
                onClick={() => navigate(`/chat/${profile.id}`)}
                data-ocid="message-btn"
                className="flex-1 h-10 rounded-full bg-surface-higher border border-white/15 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-high transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            )}

            {profile.tier !== "free" && (
              <button
                type="button"
                onClick={() => setShowSubscribe(true)}
                data-ocid="subscribe-btn"
                className="flex-1 h-10 btn-gold rounded-full text-dark text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5" />
                Subscribe
              </button>
            )}
          </div>
        </div>

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="mb-4">
            <div className="px-4 mb-3 text-sm font-semibold text-white">Highlights</div>
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
              {highlights.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="flex-shrink-0 flex flex-col items-center gap-1.5"
                  data-ocid={`highlight-${h.id}`}
                  aria-label={`View ${h.title} highlight`}
                >
                  <div className="w-16 h-16 rounded-full story-ring p-0.5">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={h.coverUrl} alt={h.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                  <span className="text-xs text-white/70 max-w-[4rem] truncate">{h.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content tabs */}
        <div className="border-t border-white/8">
          <div className="flex">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-ocid={`tab-${tab.id}`}
                className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${
                  activeTab === tab.id ? "text-primary border-primary" : "text-white/40 border-transparent"
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>
          <VideoGrid userId={id} tab={activeTab} />
        </div>
      </div>

      <QRShareModal
        open={showQR}
        onClose={() => setShowQR(false)}
        username={profile.username}
        displayName={profile.displayName}
        avatarUrl={profile.avatarUrl}
      />

      <PremiumUpgradeSheet
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        currentTier={profile.tier}
      />

      {followListType && (
        <FollowListModal
          userId={id}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </>
  );
}
