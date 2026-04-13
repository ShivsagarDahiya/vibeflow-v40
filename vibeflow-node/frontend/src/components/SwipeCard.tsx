import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import type { MatchCandidate, SwipeDirection } from "../types/match";
import { Play, MapPin, Star } from "lucide-react";

interface SwipeCardProps {
  candidate: MatchCandidate;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (direction: SwipeDirection, candidateId: string) => void;
}

export function SwipeCard({ candidate, isTop, stackIndex, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [dragDir, setDragDir] = useState<SwipeDirection>(null);

  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
  const superOpacity = useTransform(y, [-100, -30], [1, 0]);

  const cardRef = useRef<HTMLDivElement>(null);

  const imgSrc = candidate.coverPhoto || candidate.avatar;
  const age = candidate.joinedAt
    ? Math.floor((Date.now() - new Date(candidate.joinedAt).getTime()) / (365.25 * 24 * 3600 * 1000 * 3))
    : undefined;

  function handleDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset } = info;
    if (Math.abs(offset.y) > Math.abs(offset.x) && offset.y < -40) {
      setDragDir("up");
    } else if (offset.x > 40) {
      setDragDir("right");
    } else if (offset.x < -40) {
      setDragDir("left");
    } else {
      setDragDir(null);
    }
  }

  async function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset, velocity } = info;
    const flyOutX = offset.x > 80 || velocity.x > 500 ? 800 : offset.x < -80 || velocity.x < -500 ? -800 : null;
    const flyOutY = offset.y < -80 || velocity.y < -500 ? -800 : null;

    if (flyOutY !== null) {
      await animate(y, flyOutY, { duration: 0.35, ease: "easeOut" });
      onSwipe("up", candidate.id);
    } else if (flyOutX !== null) {
      await animate(x, flyOutX, { duration: 0.35, ease: "easeOut" });
      onSwipe(flyOutX > 0 ? "right" : "left", candidate.id);
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
      setDragDir(null);
    }
  }

  const scale = isTop ? 1 : Math.max(0.94 - stackIndex * 0.02, 0.88);
  const yOffset = isTop ? 0 : stackIndex * 12;

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : yOffset,
        rotate: isTop ? rotate : 0,
        scale,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { scale: 1.01 } : {}}
    >
      {/* Gradient border glow */}
      <div className="absolute inset-0 rounded-3xl p-[2px]" style={{
        background: dragDir === "right"
          ? "linear-gradient(135deg, #22c55e, #86efac)"
          : dragDir === "left"
          ? "linear-gradient(135deg, #ef4444, #fca5a5)"
          : dragDir === "up"
          ? "linear-gradient(135deg, #3b82f6, #93c5fd)"
          : "linear-gradient(135deg, #e91e63 0%, #f4a460 50%, #e91e63 100%)",
      }}>
        <div className="w-full h-full rounded-3xl overflow-hidden bg-zinc-950">
          {/* Profile photo */}
          <img
            src={imgSrc}
            alt={candidate.displayName}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* LIKE overlay */}
          <motion.div
            className="absolute inset-0 rounded-3xl flex items-start justify-start p-6 pt-10"
            style={{ opacity: likeOpacity }}
          >
            <div className="border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-20deg]">
              <span className="text-green-400 font-black text-3xl tracking-widest">LIKE</span>
            </div>
          </motion.div>

          {/* NOPE overlay */}
          <motion.div
            className="absolute inset-0 rounded-3xl flex items-start justify-end p-6 pt-10"
            style={{ opacity: nopeOpacity }}
          >
            <div className="border-4 border-red-400 rounded-xl px-4 py-2 rotate-[20deg]">
              <span className="text-red-400 font-black text-3xl tracking-widest">NOPE</span>
            </div>
          </motion.div>

          {/* SUPER LIKE overlay */}
          <motion.div
            className="absolute inset-0 rounded-3xl flex items-start justify-center p-6 pt-10"
            style={{ opacity: superOpacity }}
          >
            <div className="border-4 border-blue-400 rounded-xl px-6 py-2">
              <span className="text-blue-400 font-black text-3xl tracking-widest">SUPER</span>
            </div>
          </motion.div>

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-3/5 rounded-b-3xl"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)" }}
          />

          {/* Compatibility score badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #f4a460, #e8872a)" }}
          >
            <Star size={12} className="text-white fill-white" />
            <span className="text-white font-bold text-sm">{candidate.compatibilityScore}%</span>
          </div>

          {/* Video indicator */}
          {candidate.hasVideos && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Play size={12} className="text-white fill-white" />
              <span className="text-white text-xs font-medium">Video</span>
            </div>
          )}

          {/* Card info */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
            {/* Name + age + distance */}
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-white font-bold text-2xl leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {candidate.displayName}
              </h2>
              {age !== undefined && (
                <span className="text-white/80 text-lg font-light">{age > 0 ? age : "24"}</span>
              )}
            </div>

            {/* Location */}
            {candidate.location && (
              <div className="flex items-center gap-1 mb-3">
                <MapPin size={13} className="text-white/60" />
                <span className="text-white/60 text-sm">{candidate.location}</span>
              </div>
            )}

            {/* Bio snippet */}
            {candidate.bio && (
              <p className="text-white/70 text-sm line-clamp-2 mb-3">{candidate.bio}</p>
            )}

            {/* Niche tags */}
            {candidate.nicheTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {candidate.nicheTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(233,30,99,0.25)", color: "#f48fb1", border: "1px solid rgba(233,30,99,0.4)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
