/**
 * useSettings — loads UserSettings from the backend, caches in component
 * state, and provides updateSetting() for optimistic + persistent updates.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserSettings } from "../backend";
import { useBackend } from "./useBackend";

const DEFAULT_SETTINGS: UserSettings = {
  isPrivate: false,
  notificationsEnabled: true,
  theme: "dark",
  language: "en",
  contentFilter: "standard",
  ageRestriction: false,
  blockedHashtags: "",
  blockedUsers: "",
  twoFactorEnabled: false,
  emailNotifications: false,
  pushNotifications: true,
  autoPlayVideos: true,
  videoQuality: "auto",
  activityStatusVisible: true,
  readReceiptsEnabled: true,
  muteNotificationSound: false,
  dmPrivacy: "everyone",
  showOnlineStatus: true,
};

export function useSettings() {
  const { backend, isLoggedIn } = useBackend();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings once on mount (or when backend becomes available)
  useEffect(() => {
    if (!backend || !isLoggedIn) return;
    let cancelled = false;
    setLoading(true);
    backend
      .getUserSettings()
      .then((s: UserSettings) => {
        if (!cancelled) {
          setSettings(s);
        }
      })
      .catch(() => {
        // Backend not ready or user has no settings yet — use defaults
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [backend, isLoggedIn]);

  /**
   * Optimistically update a single setting key, then persist the full
   * settings object to the backend (debounced 400 ms).
   */
  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };

        // Debounce persistence
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
          if (!backend) return;
          setSaving(true);
          try {
            await backend.updateUserSettings(
              next.isPrivate,
              next.notificationsEnabled,
              next.theme,
              next.language,
              next.contentFilter,
              next.ageRestriction,
              next.blockedHashtags,
              next.blockedUsers,
              next.twoFactorEnabled,
              next.emailNotifications,
              next.pushNotifications,
              next.autoPlayVideos,
              next.videoQuality,
              next.activityStatusVisible,
              next.readReceiptsEnabled,
              next.muteNotificationSound,
              next.dmPrivacy,
              next.showOnlineStatus,
            );
          } catch {
            // Persist failure is silent — UI already reflects optimistic value
          } finally {
            setSaving(false);
          }
        }, 400);

        return next;
      });
    },
    [backend],
  );

  /** Persist the full settings object immediately (no debounce). */
  const saveSettings = useCallback(
    async (next: UserSettings) => {
      if (!backend) return;
      setSettings(next);
      setSaving(true);
      try {
        await backend.updateUserSettings(
          next.isPrivate,
          next.notificationsEnabled,
          next.theme,
          next.language,
          next.contentFilter,
          next.ageRestriction,
          next.blockedHashtags,
          next.blockedUsers,
          next.twoFactorEnabled,
          next.emailNotifications,
          next.pushNotifications,
          next.autoPlayVideos,
          next.videoQuality,
          next.activityStatusVisible,
          next.readReceiptsEnabled,
          next.muteNotificationSound,
          next.dmPrivacy,
          next.showOnlineStatus,
        );
      } catch {
        // silent
      } finally {
        setSaving(false);
      }
    },
    [backend],
  );

  return { settings, loading, saving, updateSetting, saveSettings };
}
