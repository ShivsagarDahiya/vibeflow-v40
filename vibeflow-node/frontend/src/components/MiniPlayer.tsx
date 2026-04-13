import { AnimatePresence, motion } from "framer-motion";
import type { VideoItem } from "../types/feed";

interface MiniPlayerProps {
  video: VideoItem | null;
  isVisible: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export function MiniPlayer({ video, isVisible, onClose, onExpand }: MiniPlayerProps) {
  if (!video) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-16 left-0 right-0 z-30 px-3"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          data-ocid="mini-player"
        >
          <div
            className="flex items-center gap-3 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: "rgba(26, 10, 18, 0.95)", backdropFilter: "blur(20px)" }}
          >
            {/* Thumbnail */}
            <div className="w-12 h-16 flex-shrink-0 overflow-hidden">
              <img
                src={video.thumbnailUrl}
                alt={video.caption}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <button
              type="button"
              className="flex-1 min-w-0 text-left py-3"
              onClick={onExpand}
              aria-label="Expand video"
              data-ocid="mini-player-expand"
            >
              <p className="text-white text-sm font-semibold truncate">{video.creator.displayName}</p>
              <p className="text-white/60 text-xs truncate">{video.caption}</p>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1 pr-3">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#e91e63]/20 flex items-center justify-center text-[#e91e63]"
                onClick={onExpand}
                aria-label="Expand to fullscreen"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>Expand</title>
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                onClick={onClose}
                aria-label="Close mini player"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>Close</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
