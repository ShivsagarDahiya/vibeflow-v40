import { TrendingUp, Eye, Users, Zap, Play } from "lucide-react";
import type { AnalyticsData } from "../hooks/useProfile";
import { formatCount } from "../lib/format";

interface Props {
  analytics: AnalyticsData;
  isLoading?: boolean;
}

function Sparkline({ data, height = 40 }: { data: number[]; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} role="img" aria-label="Follower growth sparkline">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e91e63" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e91e63" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="#e91e63"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* fill area */}
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sparkGrad)"
      />
    </svg>
  );
}

export default function CreatorAnalytics({ analytics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="mx-4 rounded-2xl bg-surface-high border border-white/8 p-4 space-y-4">
        <div className="h-4 w-32 rounded skeleton" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl skeleton" />
          ))}
        </div>
        <div className="h-12 rounded skeleton" />
      </div>
    );
  }

  return (
    <div className="mx-4 rounded-2xl bg-surface-high border border-white/8 p-4 space-y-4" data-ocid="creator-analytics">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-semibold text-gold font-display">Creator Analytics</h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface-higher p-3 text-center">
          <Eye className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-base font-bold text-white">{formatCount(analytics.totalViews)}</div>
          <div className="text-xs text-white/50">Total Views</div>
        </div>
        <div className="rounded-xl bg-surface-higher p-3 text-center">
          <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">
            +{analytics.followerGrowth.at(-1) ?? 0}
          </div>
          <div className="text-xs text-white/50">New Fans</div>
        </div>
        <div className="rounded-xl bg-surface-higher p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">
            {(analytics.engagementRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-white/50">Engagement</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-white/40">
          <span>Follower Growth</span>
          <span className="text-primary">{analytics.growthLabels?.at(-1)}</span>
        </div>
        <div className="rounded-xl bg-surface-higher p-2">
          <Sparkline data={analytics.followerGrowth} height={40} />
        </div>
        <div className="flex justify-between">
          {analytics.growthLabels?.slice(0, 4).map((label, i) => (
            <span key={i} className="text-xs text-white/30">{label}</span>
          ))}
        </div>
      </div>

      {/* Top video */}
      {analytics.topVideoThumbnail && (
        <div className="flex items-center gap-3 rounded-xl bg-surface-higher p-3">
          <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={analytics.topVideoThumbnail}
              alt="Top video"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1">Top Performing Video</div>
            <div className="text-sm font-semibold text-white flex items-center gap-1">
              <Eye className="w-3 h-3 text-primary" />
              {formatCount(analytics.topVideoViews)} views
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
