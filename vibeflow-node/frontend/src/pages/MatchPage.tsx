import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Heart, Clock, X, Star } from "lucide-react";
import { SwipeCard } from "../components/SwipeCard";
import { MatchOverlay } from "../components/MatchOverlay";
import {
  useMatchCandidates,
  useMatches,
  usePendingRequests,
  useSendMatchRequest,
  useAcceptMatch,
  useDeclineMatch,
} from "../hooks/useMatching";
import { useMyProfile } from "../hooks/useProfile";
import type { MatchCandidate, MatchTab, SwipeDirection } from "../types/match";

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden animate-pulse"
      style={{ background: "linear-gradient(135deg, #1a0a12, #120a18)" }}
    >
      <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950" />
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 space-y-3">
        <div className="h-7 w-40 rounded-lg bg-white/10" />
        <div className="h-4 w-28 rounded-lg bg-white/8" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-white/10" />
          <div className="h-6 w-20 rounded-full bg-white/10" />
          <div className="h-6 w-14 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-5">
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, -8, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="text-7xl"
      >
        💝
      </motion.div>
      <div>
        <h3 className="text-white font-bold text-2xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          No more profiles
        </h3>
        <p className="text-white/50 text-sm leading-relaxed">
          You've seen everyone nearby.<br />Check back later for new people.
        </p>
      </div>
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="flex gap-1.5"
      >
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ background: "#e91e63" }} />
        ))}
      </motion.div>
    </div>
  );
}

export default function MatchPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MatchTab>("discover");
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [matchOverlay, setMatchOverlay] = useState<{ visible: boolean; user: MatchCandidate | null }>({
    visible: false, user: null,
  });

  const { data: myProfile } = useMyProfile();
  const myAvatar = myProfile?.avatarUrl ?? "";

  const { data: candidatePages, isLoading: candidatesLoading } = useMatchCandidates(8);
  const { data: matchPages, isLoading: matchesLoading } = useMatches(20);
  const { data: requestPages, isLoading: requestsLoading } = usePendingRequests(20);

  const sendRequest = useSendMatchRequest();
  const acceptMatch = useAcceptMatch();
  const declineMatch = useDeclineMatch();

  // Flatten + filter swiped
  const candidates = useMemo(() => {
    const all = candidatePages?.pages.flatMap((p) => p.candidates) ?? [];
    return all.filter((c) => !swipedIds.has(c.id));
  }, [candidatePages, swipedIds]);

  const matches = useMemo(
    () => matchPages?.pages.flatMap((p) => p.matches) ?? [],
    [matchPages]
  );

  const requests = useMemo(
    () => requestPages?.pages.flatMap((p) => p.requests) ?? [],
    [requestPages]
  );

  const topCard = candidates[0];
  const stackCards = candidates.slice(1, 4);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection, candidateId: string) => {
      setSwipedIds((prev) => new Set([...prev, candidateId]));
      if (direction === "right" || direction === "up") {
        try {
          const result = await sendRequest.mutateAsync(candidateId);
          // @ts-expect-error runtime shape
          if (result?.isMatch) {
            const matched = candidates.find((c) => c.id === candidateId) ?? null;
            setMatchOverlay({ visible: true, user: matched });
          }
        } catch {
          // silently ignore — candidate already filtered
        }
      }
    },
    [candidates, sendRequest]
  );

  function triggerButtonSwipe(direction: SwipeDirection) {
    if (!topCard) return;
    handleSwipe(direction, topCard.id);
  }

  const tabs: { id: MatchTab; label: string; icon: React.ReactNode }[] = [
    { id: "discover", label: "Discover", icon: <Heart size={16} /> },
    { id: "matches", label: "Matches", icon: <Star size={16} /> },
    { id: "requests", label: "Requests", icon: <Clock size={16} /> },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0a0008 0%, #12050e 40%, #0d020a 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4 relative z-20">
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "'Playfair Display', serif",
            background: "linear-gradient(135deg, #e91e63, #f4a460)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Match
        </h1>
        <button type="button" data-ocid="match-settings" className="p-2 rounded-full bg-white/8 border border-white/10" aria-label="Settings">
          <Settings size={20} className="text-white/60" />
        </button>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 mx-5 mb-4 p-1 rounded-2xl bg-white/5 border border-white/10 relative z-20">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`match-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={
              activeTab === tab.id
                ? { background: "linear-gradient(135deg, #e91e63, #c2185b)", color: "#fff" }
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            {tab.icon}
            {tab.label}
            {tab.id === "requests" && requests.length > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center justify-center leading-none">
                {requests.length > 9 ? "9+" : requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================== DISCOVER TAB ======================== */}
      <AnimatePresence mode="wait">
        {activeTab === "discover" && (
          <motion.div
            key="discover"
            className="flex flex-col flex-1 px-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22 }}
          >
            {/* Swipe deck */}
            <div className="relative flex-1 min-h-0" style={{ height: "calc(100vh - 280px)" }}>
              {candidatesLoading ? (
                <SkeletonCard />
              ) : candidates.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {/* Stack (back cards) */}
                  {[...stackCards].reverse().map((c, ri) => {
                    const idx = stackCards.length - 1 - ri;
                    return (
                      <SwipeCard
                        key={c.id}
                        candidate={c}
                        isTop={false}
                        stackIndex={idx + 1}
                        onSwipe={handleSwipe}
                      />
                    );
                  })}
                  {/* Top card */}
                  {topCard && (
                    <SwipeCard
                      key={topCard.id}
                      candidate={topCard}
                      isTop
                      stackIndex={0}
                      onSwipe={handleSwipe}
                    />
                  )}
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-5 py-6 pb-10">
              {/* NOPE */}
              <motion.button
                data-ocid="match-nope-btn"
                whileTap={{ scale: 0.88 }}
                onClick={() => triggerButtonSwipe("left")}
                disabled={!topCard}
                aria-label="Nope"
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-red-500/50 disabled:opacity-30"
                style={{ background: "rgba(239,68,68,0.12)" }}
              >
                <X size={26} className="text-red-400" />
              </motion.button>

              {/* SUPER LIKE (Match Request) */}
              <motion.button
                data-ocid="match-superlike-btn"
                whileTap={{ scale: 0.88 }}
                onClick={() => triggerButtonSwipe("up")}
                disabled={!topCard}
                aria-label="Super Like"
                className="w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-30 shadow-lg"
                style={{ background: "linear-gradient(135deg, #f4a460, #e8872a)" }}
              >
                <Star size={30} className="text-white fill-white" />
              </motion.button>

              {/* LIKE */}
              <motion.button
                data-ocid="match-like-btn"
                whileTap={{ scale: 0.88 }}
                onClick={() => triggerButtonSwipe("right")}
                disabled={!topCard}
                aria-label="Like"
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 disabled:opacity-30"
                style={{ background: "rgba(233,30,99,0.15)", borderColor: "rgba(233,30,99,0.5)" }}
              >
                <Heart size={26} className="text-pink-400 fill-pink-400" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ======================== MATCHES TAB ======================== */}
        {activeTab === "matches" && (
          <motion.div
            key="matches"
            className="flex flex-col flex-1 overflow-y-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {matchesLoading ? (
              <div className="flex flex-col gap-3 px-5 py-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded bg-white/10" />
                      <div className="h-3 w-20 rounded bg-white/8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-8">
                <span className="text-5xl mb-4">💌</span>
                <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  No matches yet
                </h3>
                <p className="text-white/40 text-sm">Start swiping to find your vibe</p>
              </div>
            ) : (
              <>
                {/* Horizontal avatar row */}
                <div className="px-5 py-3 overflow-x-auto">
                  <div className="flex gap-4">
                    {matches.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        data-ocid={`match-avatar-${m.id}`}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      >
                        <div className="w-16 h-16 rounded-full p-[2.5px]"
                          style={{ background: "linear-gradient(135deg, #e91e63, #f4a460, #e91e63)" }}
                        >
                          <img src={m.avatar} alt={m.displayName} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <span className="text-white/70 text-xs truncate max-w-16">{m.displayName.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px mx-5 bg-white/10 my-1" />

                {/* Vertical matches list */}
                <div className="flex flex-col px-5 py-2 gap-1 pb-10">
                  {matches.map((m) => (
                    <motion.div
                      key={m.id}
                      data-ocid={`match-row-${m.id}`}
                      className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-14 h-14 rounded-full p-[2px] flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
                      >
                        <img src={m.avatar} alt={m.displayName} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{m.displayName}</p>
                        {m.lastActivity && (
                          <p className="text-white/40 text-xs mt-0.5 truncate">{m.lastActivity}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        data-ocid={`match-message-${m.id}`}
                        className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #e91e63, #c2185b)" }}
                      >
                        Message
                      </button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ======================== REQUESTS TAB ======================== */}
        {activeTab === "requests" && (
          <motion.div
            key="requests"
            className="flex flex-col flex-1 overflow-y-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {requestsLoading ? (
              <div className="flex flex-col gap-3 px-5 py-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded bg-white/10" />
                      <div className="h-3 w-40 rounded bg-white/8" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-20 h-9 rounded-xl bg-white/10" />
                      <div className="w-16 h-9 rounded-xl bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-8">
                <span className="text-5xl mb-4">🌹</span>
                <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  No pending requests
                </h3>
                <p className="text-white/40 text-sm">When someone likes you, they'll appear here</p>
              </div>
            ) : (
              <div className="flex flex-col px-5 py-3 gap-2 pb-10">
                {requests.map((req) => (
                  <motion.div
                    key={req.id}
                    data-ocid={`request-row-${req.id}`}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/8"
                    style={{ background: "rgba(233,30,99,0.05)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
                    >
                      <img
                        src={req.fromUser.coverPhoto || req.fromUser.avatar}
                        alt={req.fromUser.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{req.fromUser.displayName}</p>
                      {req.fromUser.nicheTags.length > 0 && (
                        <p className="text-white/40 text-xs mt-0.5 truncate">
                          {req.fromUser.nicheTags.slice(0, 2).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        data-ocid={`request-accept-${req.id}`}
                        onClick={() => acceptMatch.mutate(req.id)}
                        disabled={acceptMatch.isPending}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #e91e63, #c2185b)" }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        data-ocid={`request-decline-${req.id}`}
                        onClick={() => declineMatch.mutate(req.id)}
                        disabled={declineMatch.isPending}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-white/60 border border-white/15 disabled:opacity-60"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        Decline
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match overlay */}
      <MatchOverlay
        isVisible={matchOverlay.visible}
        myAvatar={myAvatar}
        matchedUser={matchOverlay.user}
        onSendMessage={() => {
          const userId = matchOverlay.user?.id;
          setMatchOverlay({ visible: false, user: null });
          if (userId) navigate(`/chat/${userId}`);
        }}
        onKeepSwiping={() => setMatchOverlay({ visible: false, user: null })}
      />
    </div>
  );
}
