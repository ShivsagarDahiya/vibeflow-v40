import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface LocationState {
  from?: string;
}

// Animated floating hearts background
function FloatingHearts() {
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 8) % 90}%`,
    delay: i * 0.4,
    duration: 4 + (i % 3) * 2,
    size: 10 + (i % 4) * 6,
    opacity: 0.05 + (i % 4) * 0.04,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute"
          style={{ left: h.left, bottom: "-20px", fontSize: h.size, opacity: h.opacity }}
          animate={{
            y: [0, -window.innerHeight - 40],
            x: [0, (h.id % 2 === 0 ? 1 : -1) * (10 + h.id * 4)],
            rotate: [-10, 10, -10],
          }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as LocationState)?.from ?? "/";

  // If already authenticated, redirect
  useEffect(() => {
    if (status === "authenticated") {
      navigate(from, { replace: true });
    }
  }, [status, navigate, from]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login();
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate, from]);

  return (
    <div
      className="relative flex flex-col items-center justify-between h-dvh overflow-hidden pt-safe pb-safe"
      style={{ background: "var(--color-dark)" }}
    >
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--color-primary)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--color-gold)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--color-primary)" }}
        />
      </div>

      {/* Floating hearts */}
      <FloatingHearts />

      {/* Top spacing */}
      <div className="flex-1" />

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-6 px-8 text-center"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-love-lg"
            style={{
              background: "var(--gradient-love)",
              fontFamily: "var(--font-display)",
            }}
          >
            V
          </div>
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-3xl animate-pulse-ring opacity-40"
            style={{ border: "2px solid var(--color-primary)" }}
          />
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <h1
            className="text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VibeFlow
          </h1>
          <p className="text-white/60 text-base font-medium leading-relaxed max-w-xs">
            Share your vibe. Discover connections. Live your story.
          </p>
        </motion.div>

        {/* Features pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {["📹 Videos", "💫 Stories", "💬 Chat", "💘 Match", "🔴 Live"].map(
            (f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white/70"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {f}
              </span>
            )
          )}
        </motion.div>
      </motion.div>

      <div className="flex-1" />

      {/* CTA section */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 w-full px-6 flex flex-col gap-4 pb-10"
      >
        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm font-medium py-2 px-4 rounded-xl"
              style={{
                background: "rgba(233,30,99,0.15)",
                border: "1px solid rgba(233,30,99,0.3)",
                color: "#f48fb1",
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Main CTA button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading || status === "initializing"}
          data-ocid="login-btn"
          className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-smooth disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
          style={{
            background: "var(--gradient-love)",
            boxShadow: "var(--shadow-love)",
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              Continue with Internet Identity
            </span>
          )}
        </button>

        {/* Disclaimer */}
        <p className="text-center text-white/35 text-xs px-4 leading-relaxed">
          By continuing, you agree to VibeFlow's Terms of Service and Privacy
          Policy. Your identity is secured by the Internet Computer.
        </p>
      </motion.div>
    </div>
  );
}
