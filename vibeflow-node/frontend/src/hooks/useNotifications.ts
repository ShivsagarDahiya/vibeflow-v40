import { useCallback, useEffect, useState } from "react";
import type { AppNotification } from "@/types/chat";

const API = "/api";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/notifications`);
      if (res.ok) {
        const data: AppNotification[] = await res.json();
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const timer = setInterval(() => { void fetchNotifications(); }, 500);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch(`${API}/notifications/read-all`, { method: "POST" });
    } catch {
      // ignore
    }
  }, []);

  const handleAction = useCallback(
    async (notifId: string, action: "accepted" | "declined" | "followed_back") => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId
            ? { ...n, requiresAction: false, actionTaken: action, isRead: true }
            : n
        )
      );
      try {
        await fetch(`${API}/notifications/${notifId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const followRequests = notifications.filter(
    (n) => n.type === "follow_request" && n.requiresAction
  );

  const grouped = {
    today: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        n.type !== "follow_request"
      );
    }),
    yesterday: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      const yesterday = new Date(Date.now() - 86400000);
      return (
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear() &&
        n.type !== "follow_request"
      );
    }),
    earlier: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      const yesterday = new Date(Date.now() - 86400000);
      return d < yesterday && n.type !== "follow_request";
    }),
  };

  return { notifications, loading, unreadCount, followRequests, grouped, markAllRead, handleAction };
}
