/**
 * useActivityStatus — marks the current user as "online" on mount and
 * every 20 s, and provides a getActivityStatus(principal) lookup.
 */

import type { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect } from "react";
import { useBackend } from "./useBackend";

export function useActivityStatus() {
  const { backend, isLoggedIn } = useBackend();

  // Heartbeat: update own status to "online" every 20 s
  useEffect(() => {
    if (!backend || !isLoggedIn) return;

    const pulse = () => {
      backend.updateActivityStatus("online").catch(() => {});
    };

    pulse();
    const id = setInterval(pulse, 20_000);
    return () => {
      clearInterval(id);
      // Mark offline when component unmounts (best-effort)
      backend.updateActivityStatus("offline").catch(() => {});
    };
  }, [backend, isLoggedIn]);

  /**
   * Fetch the activity status string for a given principal.
   * Returns "offline" on any error.
   */
  const getActivityStatus = useCallback(
    async (principal: Principal): Promise<string> => {
      if (!backend) return "offline";
      try {
        return await backend.getActivityStatus(principal);
      } catch {
        return "offline";
      }
    },
    [backend],
  );

  return { getActivityStatus };
}
