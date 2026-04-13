import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, RefreshCw } from "lucide-react";
import type { MatchCandidate } from "../types/match";

interface MatchOverlayProps {
  isVisible: boolean;
  myAvatar: string;
  matchedUser: MatchCandidate | null;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

const HEARTS = ["❤️", "💕", "💖", "💗", "💝", "💓", "🌹", "✨"];

function ConfettiHeart({ delay, x, size }: { delay: number; x: number; size: number }) {
  const heart = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  return (
    <motion.div
      className="absolute top-0 pointer-events-none select-none"
      style={{ left: `${x}%`, fontSize: size }}
      initial={{ y: -60, opacity: 1, rotate: Math.random() * 40 - 20 }}
      animate={{
        y: "110vh",
        opacity: [1, 1, 0.6, 0],
        rotate: [Math.random() * 40 - 20, Math.random() * 80 - 40],
        x: [0, (Math.random() - 0.5) * 80],
      }}
      transition={{ duration: 2.8 + Math.random() * 1.5, delay, ease: "linear" }}
    >
      {heart}
    </motion.div>
  );
}

const confettiItems = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  delay: i * 0.12,
  x: Math.random() * 100,
  size: 14 + Math.floor(Math.random() * 20),
}));

export function MatchOverlay({
  isVisible,
  myAvatar,
  matchedUser,
  onSendMessage,
  onKeepSwiping,
}: MatchOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && matchedUser && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(10,0,10,0.97) 0%, rgba(40,5,25,0.98) 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Confetti hearts */}
          {confettiItems.map((h) => (
            <ConfettiHeart key={h.id} delay={h.delay} x={h.x} size={h.size} />
          ))}

          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(233,30,99,0.18) 0%, transparent 70%)",
            }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-8 text-center"
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.15 }}
          >
            {/* It's a Match title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-1">
                You matched with
              </p>
              <h1
                className="font-bold mb-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(2.2rem, 8vw, 3.5rem)",
                  background: "linear-gradient(135deg, #e91e63 0%, #f4a460 60%, #e91e63 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                It's a Match!
              </h1>
              <p className="text-white/60 text-sm">You and {matchedUser.displayName} liked each other</p>
            </motion.div>

            {/* Avatars */}
            <div className="flex items-center justify-center gap-4 my-10">
              {/* My avatar */}
              <motion.div
                className="relative"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <div className="w-28 h-28 rounded-full p-[3px]"
                  style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
                >
                  <img src={myAvatar} alt="You" className="w-full h-full rounded-full object-cover" />
                </div>
              </motion.div>

              {/* Heart icon */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              >
                <span className="text-4xl">❤️</span>
              </motion.div>

              {/* Their avatar */}
              <motion.div
                className="relative"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <div className="w-28 h-28 rounded-full p-[3px]"
                  style={{ background: "linear-gradient(135deg, #f4a460, #e91e63)" }}
                >
                  <img
                    src={matchedUser.coverPhoto || matchedUser.avatar}
                    alt={matchedUser.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </motion.div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <motion.button
                data-ocid="match-send-message"
                onClick={onSendMessage}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-semibold text-white text-base"
                style={{ background: "linear-gradient(135deg, #e91e63, #c2185b)" }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <MessageCircle size={18} />
                Send a Message
              </motion.button>

              <motion.button
                data-ocid="match-keep-swiping"
                onClick={onKeepSwiping}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-medium text-white/70 text-base border border-white/15"
                style={{ background: "rgba(255,255,255,0.05)" }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
              >
                <RefreshCw size={16} />
                Keep Swiping
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
