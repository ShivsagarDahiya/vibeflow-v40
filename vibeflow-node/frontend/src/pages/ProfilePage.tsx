import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Edit3,
  Share2,
  Crown,
  CheckCircle,
  Grid3x3,
  Heart,
  Bookmark,
  Users2,
  Play,
  Eye,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useMyProfile,
  useHighlights,
  useMyAnalytics,
  useAchievements,
  useUserVideos,
} from "../hooks/useProfile";
import { formatCount } from "../lib/format";
import AchievementBadges from "../components/AchievementBadges";
import CreatorAnalytics from "../components/CreatorAnalytics";
import QRShareModal from "../components/QRShareModal";
import PremiumUpgradeSheet from "../components/PremiumUpgradeSheet";
import FollowListModal from "../components/FollowListModal";

type ContentTab = "videos" | "liked" | "saved" | "duets";

const CONTENT_TABS: Array<{ id: ContentTab; label: string; icon: React.ReactNode }> = [
  { id: "videos", label: "Videos", icon: <Grid3x3 className="w-4 h-4" /> },
  { id: "liked", label: "Liked", icon: <Heart className="w-4 h-4" /> },
  { id: "saved", label: "Saved", icon: <Bookmark className="w-4 h-4" /> },
  { id: "duets", label: "Duets", icon: <Users2 className="w-4 h-4" /> },
];

function TierBadge({ tier }: { tier: string }) {
  if (tier === "fan") return (
    <span className="text-xs font-semibold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">Fan</span>
  );
  if (tier === "creator") return (
    <span className="text-xs font-semibold text-gradient-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">Creator</span>
  );
  if (tier === "vip") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-dark bg-gradient-to-r from-gold to-primary px-2 py-0.5 rounded-full">
      <Crown className="w-3 h-3" /> VIP
    </span>
  );
  return null;
}

function VideoGrid({ userId, tab }: { userId: string; tab: ContentTab }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserVideos(userId, tab);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allVideos = data?.pages.flatMap((p) => p.videos) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-[9/16] skeleton" />
        ))}
      </div>
    );
  }

  if (!allVideos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30" data-ocid="empty-tab">
        <div className="text-4xl mb-3">📹</div>
        <div className="text-sm">No {tab} videos yet</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-0.5">
        {allVideos.map((v) => (
          <button
            key={v.id}
            type="button"
            className="relative aspect-[9/16] overflow-hidden group"
            data-ocid="profile-video-thumb"
          >
            <img
              src={v.thumbnailUrl}
              alt="Video thumbnail"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-xs">
              <Play className="w-3 h-3 fill-white" />
              <span>{formatCount(v.viewsCount)}</span>
            </div>
          </button>
        ))}
      </div>
      <div ref={sentinelRef} className="h-8 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>("videos");
  const [showQR, setShowQR] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: highlights } = useHighlights(profile?.id ?? "");
  const { data: analytics, isLoading: analyticsLoading } = useMyAnalytics();
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();

  const isCreator = profile?.tier === "creator" || profile?.tier === "vip";
  const highlightsScrollRef = useRef<HTMLDivElement>(null);

  const scrollHighlights = useCallback((dir: "left" | "right") => {
    const el = highlightsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
  }, []);

  if (profileLoading) {
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

  if (!profile) return null;

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab" data-ocid="profile-page">
        {/* Cover photo */}
        <div className="relative h-52 flex-shrink-0">
          {profile.coverPhotoUrl ? (
            <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-300 via-primary/20 to-dark-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent" />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="absolute top-12 right-4 w-9 h-9 rounded-full glass-dark flex items-center justify-center text-white/80 hover:text-white"
            data-ocid="settings-btn"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar + info */}
        <div className="flex flex-col items-center -mt-14 px-4 pb-4">
          {/* Avatar ring based on tier */}
          <div className={`relative mb-3 ${profile.tier === "vip" ? "vip-ring p-0.5" : profile.tier === "creator" || profile.tier === "fan" ? "story-ring p-0.5" : ""}`}>
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-dark">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            {profile.tier === "vip" && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full btn-gold flex items-center justify-center shadow-gold">
                <Crown className="w-4 h-4 text-dark" />
              </div>
            )}
          </div>

          {/* Display name */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-display font-semibold text-white">{profile.displayName}</h1>
            {profile.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />}
            <TierBadge tier={profile.tier} />
          </div>
          <div className="text-white/50 text-sm mb-2">@{profile.username}</div>

          {profile.bio && (
            <p className="text-white/70 text-sm text-center max-w-xs line-clamp-3 mb-3">
              {profile.bio}
            </p>
          )}

          {profile.showActivityStatus && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 mb-3">
              <Activity className="w-3 h-3" />
              {profile.isOnline ? "Active now" : profile.lastActiveAt ? `Active ${new Date(profile.lastActiveAt).toLocaleDateString()}` : "Active recently"}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-base font-bold text-white">{formatCount(profile.videoCount)}</div>
              <div className="text-xs text-white/50">Videos</div>
            </div>
            <button
              type="button"
              onClick={() => setFollowListType("followers")}
              className="text-center hover:opacity-80 transition-opacity"
              data-ocid="followers-count"
            >
              <div className="text-base font-bold text-white">{formatCount(profile.followerCount)}</div>
              <div className="text-xs text-white/50">Followers</div>
            </button>
            <button
              type="button"
              onClick={() => setFollowListType("following")}
              className="text-center hover:opacity-80 transition-opacity"
              data-ocid="following-count"
            >
              <div className="text-base font-bold text-white">{formatCount(profile.followingCount)}</div>
              <div className="text-xs text-white/50">Following</div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => navigate("/edit-profile")}
              className="flex-1 h-10 rounded-full border border-primary/50 text-primary text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/10 transition-colors"
              data-ocid="edit-profile-btn"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-colors"
              data-ocid="share-profile-btn"
              aria-label="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {profile.tier !== "vip" && (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="flex-1 h-10 btn-gold rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 text-dark"
                data-ocid="upgrade-tier-btn"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Highlights row */}
        {highlights && highlights.length > 0 && (
          <div className="mb-4 relative">
            <div className="flex items-center px-4 mb-3">
              <h2 className="text-sm font-semibold text-white">Highlights</h2>
              <button
                type="button"
                onClick={() => scrollHighlights("left")}
                className="ml-auto w-7 h-7 rounded-full bg-surface-higher flex items-center justify-center text-white/50 hover:text-white"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollHighlights("right")}
                className="ml-1 w-7 h-7 rounded-full bg-surface-higher flex items-center justify-center text-white/50 hover:text-white"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div
              ref={highlightsScrollRef}
              className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
            >
              {highlights.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="flex-shrink-0 flex flex-col items-center gap-1.5"
                  data-ocid={`highlight-${h.id}`}
                  aria-label={`View ${h.title} highlight`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden story-ring p-0.5">
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

        {/* Creator analytics */}
        {isCreator && (
          <div className="mb-4">
            <CreatorAnalytics analytics={analytics!} isLoading={analyticsLoading} />
          </div>
        )}

        {/* Achievements */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-4 mb-2">
            <h2 className="text-sm font-semibold text-white">Achievements</h2>
            {achievements && (
              <span className="text-xs text-white/40 ml-auto">
                {achievements.filter((a) => a.isUnlocked).length}/{achievements.length} unlocked
              </span>
            )}
          </div>
          <AchievementBadges
            achievements={achievements ?? []}
            isLoading={achievementsLoading}
          />
        </div>

        {/* Content tabs */}
        <div className="border-t border-white/8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-ocid={`tab-${tab.id}`}
                className={`flex-1 min-w-[4rem] flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-white/40 border-transparent hover:text-white/60"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          <VideoGrid userId={profile.id} tab={activeTab} />
        </div>

        {/* Eye icon watermark stats */}
        <div className="flex justify-center gap-6 py-6 text-white/20 text-xs">
          <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> Member since {new Date().getFullYear()}</div>
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
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentTier={profile.tier}
      />

      {followListType && (
        <FollowListModal
          userId={profile.id}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </>
  );
}
