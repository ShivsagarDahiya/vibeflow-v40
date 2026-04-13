import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoOptionsSheetProps {
  videoId: string;
  creatorUsername: string;
  isOpen: boolean;
  onClose: () => void;
  onReport: () => void;
  onDownload: () => void;
  onDuet: () => void;
  onBlock: () => void;
}

const OPTIONS = [
  { id: "report", icon: "🚩", label: "Report" },
  { id: "download", icon: "⬇️", label: "Download" },
  { id: "duet", icon: "🎭", label: "Duet" },
  { id: "not-interested", icon: "🚫", label: "Not Interested" },
  { id: "favorites", icon: "⭐", label: "Add to Favorites" },
  { id: "share-story", icon: "📖", label: "Share to Story" },
  { id: "block", icon: "🛑", label: "Block User" },
  { id: "copy-link", icon: "🔗", label: "Copy Link" },
  { id: "watch-later", icon: "🕐", label: "Watch Later" },
  { id: "see-less", icon: "👁️", label: "See Less Like This" },
  { id: "collaborate", icon: "🤝", label: "Collaborate" },
  { id: "go-live", icon: "🔴", label: "Go Live" },
  { id: "add-effect", icon: "✨", label: "Add Effect" },
];

export function VideoOptionsSheet({
  isOpen,
  onClose,
  onReport,
  onDownload,
  onDuet,
  onBlock,
}: VideoOptionsSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleOption = (id: string) => {
    switch (id) {
      case "report": onReport(); break;
      case "download": onDownload(); break;
      case "duet": onDuet(); break;
      case "block": onBlock(); break;
      case "copy-link":
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      default: break;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0a12] rounded-t-3xl overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 pb-4">
              <p className="text-center text-white/50 text-sm pb-3 border-b border-white/10">
                Video options
              </p>

              <div className="grid grid-cols-4 gap-3 pt-4 pb-2">
                {OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => handleOption(opt.id)}
                    data-ocid={`video-option-${opt.id}`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-[10px] text-white/70 text-center leading-tight">
                      {opt.id === "copy-link" && copied ? "Copied!" : opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="w-full py-3 mt-2 rounded-2xl bg-white/5 text-white/60 font-medium text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>

            {/* Safe area bottom */}
            <div className="pb-safe" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
