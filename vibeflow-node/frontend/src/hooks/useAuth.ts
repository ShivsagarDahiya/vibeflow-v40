import { useState, useEffect, useCallback, useRef } from "react";
import { AuthClient } from "@dfinity/auth-client";
import type { Identity } from "@dfinity/agent";

const isDev = import.meta.env.DEV;

const II_URL = !isDev
  ? "https://identity.ic0.app"
  : `http://localhost:4943?canisterId=${import.meta.env.VITE_II_CANISTER_ID ?? "rdmx6-jaaaa-aaaaa-aaadq-cai"}`;

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const clientRef = useRef<AuthClient | null>(null);

  // Initialize once on mount — check existing session silently
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const client = await AuthClient.create({
          idleOptions: {
            disableIdle: true, // Disable idle timeout for better UX
          },
        });
        if (!mounted) return;
        clientRef.current = client;

        const isAuth = await client.isAuthenticated();
        if (!mounted) return;

        if (isAuth) {
          const id = client.getIdentity();
          setIdentity(id);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      } catch {
        if (mounted) setStatus("unauthenticated");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async () => {
    try {
      let client = clientRef.current;
      if (!client) {
        client = await AuthClient.create({ idleOptions: { disableIdle: true } });
        clientRef.current = client;
      }

      // If already authenticated, just update state — don't open II popup
      if (await client.isAuthenticated()) {
        setIdentity(client.getIdentity());
        setStatus("authenticated");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        client!.login({
          identityProvider: II_URL,
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
          onSuccess: () => {
            setIdentity(client!.getIdentity());
            setStatus("authenticated");
            resolve();
          },
          onError: (err) => {
            console.error("Login error:", err);
            reject(new Error(err ?? "Login failed"));
          },
        });
      });
    } catch (err) {
      console.error("useAuth.login:", err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const client = clientRef.current;
      if (client) {
        await client.logout();
        clientRef.current = null;
      }
      setIdentity(null);
      setStatus("unauthenticated");
    } catch (err) {
      console.error("useAuth.logout:", err);
      // Still clear local state
      setIdentity(null);
      setStatus("unauthenticated");
    }
  }, []);

  const principal = identity ? identity.getPrincipal().toText() : null;

  return {
    status,
    isAuthenticated: status === "authenticated",
    identity,
    principal,
    login,
    logout,
  };
}
