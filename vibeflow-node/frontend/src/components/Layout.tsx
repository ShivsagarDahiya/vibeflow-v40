import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  Heart,
  MessageCircle,
  User,
  Plus,
  Bell,
  Play,
  Pause,
  X,
} from "lucide-react";
import type { MiniPlayerState } from "@/types";
import { VideoUploadModal } from "./VideoUploadModal";

// Context for sharing mini-player state across pages
export const MiniPlayerContext = {
  state: null as MiniPlayerState | null,
};

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Explore" },
  { path: "/match", icon: Heart, label: "Match" },
  { path: "/inbox", icon: MessageCircle, label: "Inbox" },
  { path: "/profile", icon: User, label: "Profile" },
];

function VibeFlowLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ background: "var(--gradient-love)" }}
      >
        V
      </div>
      <span
        className="text-xl font-display font-semibold tracking-tight text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        VibeFlow
      </span>
    </div>
  );
}

interface MiniPlayerBarProps {
  state: MiniPlayerState;
  onClose: () => void;
}

function MiniPlayerBar({ state, onClose }: MiniPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(state.isPlaying);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      transition={{ type: "spring", damping: 20 }}
      className="relative z-40"
      style={{ background: "var(--color-surface-high)" }}
    >
      <div className="flex items-center gap-3 px-4 py-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
        >
          <img
            src={state.thumbnailUrl}
            alt={state.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{state.caption}</p>
          <p className="text-white/50 text-xs truncate">@{state.creatorUsername}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 flex items-center justify-center text-white"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-white/60"
          aria-label="Close mini player"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );
}

interface NotificationPanelProps {
  onClose: () => void;
}

function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 z-50 mx-4 mt-2 glass rounded-2xl overflow-hidden shadow-card-lg"
        style={{ background: "rgba(18,18,26,0.98)" }}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/08">
          <h3 className="text-white font-semibold text-sm">Notifications</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-6 text-center text-white/40 text-sm">
          <Bell size={24} className="mx-auto mb-2 opacity-40" />
          <p>No new notifications</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const [showNotifications, setShowNotifications] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState<MiniPlayerState | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleUpload = useCallback(() => {
    setUploadOpen(true);
  }, []);

  const activeTab = tabs.findIndex(
    (t) =>
      t.path === location.pathname ||
      (t.path !== "/" && location.pathname.startsWith(t.path))
  );

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden" style={{ background: "var(--color-dark)" }}>
      {/* Home header — transparent overlay, only on home */}
      {isHome && (
        <header
          className="absolute top-0 left-0 right-0 z-30 header-overlay pt-safe"
          data-ocid="home-header"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <VibeFlowLogo />
            <div className="flex items-center gap-3">
              {/* Upload plus icon */}
              <button
                type="button"
                onClick={handleUpload}
                data-ocid="upload-btn"
                aria-label="Create new post"
                className="w-9 h-9 flex items-center justify-center text-white hover:text-white/80 transition-colors"
              >
                <Plus size={26} strokeWidth={2.5} />
              </button>

              {/* Notification heart icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((v) => !v)}
                  data-ocid="notifications-btn"
                  aria-label="Notifications"
                  className="w-9 h-9 flex items-center justify-center text-white hover:text-white/80 transition-colors"
                >
                  <Heart size={24} strokeWidth={2} />
                </button>
                {/* Notification dot */}
                <span className="notif-dot absolute -top-0.5 -right-0.5 pointer-events-none" />

                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-hidden relative" data-ocid="main-content">
        <Outlet />
      </main>

      {/* Mini player above tab bar */}
      <AnimatePresence>
        {miniPlayer && (
          <MiniPlayerBar
            state={miniPlayer}
            onClose={() => setMiniPlayer(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav
        className="tab-bar flex-shrink-0 pb-safe"
        data-ocid="bottom-tab-bar"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 h-16">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = i === activeTab || (i === 0 && activeTab === -1);

            // Center tab — special upload button
            if (i === 2) {
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={handleUpload}
                  data-ocid={`tab-center-upload`}
                  aria-label="Upload"
                  className="flex items-center justify-center w-14 h-14 rounded-full text-white transition-smooth"
                  style={{
                    background: "var(--gradient-love)",
                    boxShadow: "var(--shadow-love)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full bg-dark flex items-center justify-center text-white text-xs font-bold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    V
                  </div>
                </button>
              );
            }

            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigate(tab.path)}
                data-ocid={`tab-${tab.label.toLowerCase()}`}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-3 py-1 transition-smooth min-w-[44px] ${
                  isActive ? "tab-active" : "text-white/40"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive && tab.path === "/inbox" ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Upload modal */}
      <VideoUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => setUploadOpen(false)}
      />
    </div>
  );
}
