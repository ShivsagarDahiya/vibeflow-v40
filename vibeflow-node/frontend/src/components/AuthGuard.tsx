import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 * While auth is still initializing, renders nothing (prevents flash).
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated" && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate("/login", {
        replace: true,
        state: { from: location.pathname },
      });
    }
    if (status === "authenticated") {
      redirectedRef.current = false;
    }
  }, [status, navigate, location.pathname]);

  // Still checking session — render nothing to prevent flash
  if (status === "initializing") {
    return (
      <div
        className="flex items-center justify-center h-dvh"
        style={{ background: "var(--color-dark)" }}
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold animate-pulse"
            style={{
              background: "var(--gradient-love)",
              boxShadow: "var(--shadow-love)",
              fontFamily: "var(--font-display)",
            }}
          >
            V
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
