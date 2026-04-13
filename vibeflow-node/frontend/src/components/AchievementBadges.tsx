import { useRef } from "react";
import { Trophy, Star, Upload, Users, TrendingUp, Crown, Lock } from "lucide-react";
import type { Achievement } from "../hooks/useProfile";

interface Props {
  achievements: Achievement[];
  isLoading?: boolean;
}

const categoryIcons: Record<Achievement["category"], React.ReactNode> = {
  upload: <Upload className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  premium: <Crown className="w-4 h-4" />,
};

const categoryColors: Record<Achievement["category"], string> = {
  upload: "text-primary",
  social: "text-blue-400",
  trending: "text-gold",
  premium: "text-gold",
};

export default function AchievementBadges({ achievements, isLoading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-20 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl skeleton" />
            <div className="w-14 h-3 rounded skeleton" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex gap-3 px-4 overflow-x-auto scrollbar-hide py-2">
      {achievements.map((badge) => (
        <div
          key={badge.id}
          className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5"
          data-ocid={`achievement-${badge.id}`}
          title={badge.description}
        >
          <div
            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-smooth ${
              badge.isUnlocked
                ? "bg-surface-higher border border-white/10"
                : "bg-surface/40 border border-white/5 opacity-40"
            }`}
          >
            {badge.isUnlocked ? (
              <>
                <span className="text-2xl">{badge.icon}</span>
                {badge.category === "premium" && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full btn-gold flex items-center justify-center">
                    <Star className="w-3 h-3" />
                  </div>
                )}
                <div className={`absolute bottom-1 right-1 ${categoryColors[badge.category]}`}>
                  {categoryIcons[badge.category]}
                </div>
              </>
            ) : (
              <>
                <span className="text-xl opacity-30">{badge.icon}</span>
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-dark/60">
                  <Lock className="w-4 h-4 text-white/30" />
                </div>
              </>
            )}
          </div>
          <span
            className={`text-xs text-center leading-tight font-medium line-clamp-2 ${
              badge.isUnlocked ? "text-white/80" : "text-white/30"
            }`}
          >
            {badge.title}
          </span>
          {badge.unlockedAt && (
            <span className="text-xs text-gold/60">
              {new Date(badge.unlockedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      ))}
      {achievements.length === 0 && (
        <div className="flex items-center justify-center w-full h-16 text-white/30 text-sm">
          <Trophy className="w-4 h-4 mr-2" />
          No achievements yet
        </div>
      )}
    </div>
  );
}
