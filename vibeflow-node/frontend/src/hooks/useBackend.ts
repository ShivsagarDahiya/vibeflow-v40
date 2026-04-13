import { useMemo } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import type { Identity } from "@dfinity/agent";
import { idlFactory } from "@/declarations/vibeflow_node_backend.did";

const isDev = import.meta.env.DEV;
const HOST = !isDev ? "https://ic0.app" : "http://127.0.0.1:4943";

const CANISTER_ID =
  import.meta.env.VITE_CANISTER_ID_VIBEFLOW_NODE_BACKEND ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VibeFlowActor = any; // replaced with generated type once bindgen runs

export interface BackendState {
  actor: VibeFlowActor | null;
  isReady: boolean;
}

export function useBackend(identity: Identity | null): BackendState {
  const actor = useMemo(() => {
    if (!identity) return null;
    if (!CANISTER_ID) {
      console.warn("VITE_CANISTER_ID_VIBEFLOW_NODE_BACKEND not set");
      return null;
    }

    try {
      const agent = HttpAgent.createSync({
        host: HOST,
        identity,
      });

      // Fetch root key for local development only
      if (isDev) {
        agent.fetchRootKey().catch(console.warn);
      }

      return Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
      });
    } catch (err) {
      console.error("useBackend: failed to create actor", err);
      return null;
    }
  }, [identity]);

  return { actor, isReady: actor !== null };
}
