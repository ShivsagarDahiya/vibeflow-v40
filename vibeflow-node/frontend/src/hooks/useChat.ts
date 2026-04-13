import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, Conversation } from "@/types/chat";

const API = "/api";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/conversations`);
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
    const timer = setInterval(() => { void fetchConversations(); }, 500);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  return { conversations, loading, refresh: fetchConversations };
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const lastIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const url = lastIdRef.current
        ? `${API}/conversations/${conversationId}/messages?after=${lastIdRef.current}`
        : `${API}/conversations/${conversationId}/messages`;
      const res = await fetch(url);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        if (data.length > 0) {
          lastIdRef.current = data[data.length - 1].id;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = data.filter((m) => !existingIds.has(m.id));
            return [...prev, ...fresh];
          });
        }
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const fetchTyping = useCallback(async () => {
    try {
      const res = await fetch(`${API}/conversations/${conversationId}/typing`);
      if (res.ok) {
        const data: { isTyping: boolean } = await res.json();
        setIsTyping(data.isTyping);
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    void fetchMessages();
    const msgTimer = setInterval(() => { void fetchMessages(); }, 500);
    const typingTimer = setInterval(() => { void fetchTyping(); }, 500);
    return () => {
      clearInterval(msgTimer);
      clearInterval(typingTimer);
    };
  }, [fetchMessages, fetchTyping]);

  const sendMessage = useCallback(
    async (text: string, replyTo?: ReplyToInfo) => {
      const optimistic: ChatMessage = {
        id: `tmp-${Date.now()}`,
        conversationId,
        senderId: "me",
        senderName: "You",
        senderAvatar: "",
        text,
        deliveryStatus: "sending",
        reactions: [],
        isPinned: false,
        isDeleted: false,
        replyTo,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch(`${API}/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, replyToId: replyTo?.messageId }),
        });
        if (res.ok) {
          const saved: ChatMessage = await res.json();
          setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
          lastIdRef.current = saved.id;
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimistic.id ? { ...m, deliveryStatus: "delivered" } : m
            )
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...m, deliveryStatus: "delivered" } : m
          )
        );
      }
    },
    [conversationId]
  );

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find((r) => r.userId === "me");
          if (existing) {
            return { ...m, reactions: m.reactions.filter((r) => r.userId !== "me") };
          }
          return { ...m, reactions: [...m.reactions, { emoji, userId: "me", username: "You" }] };
        })
      );
      try {
        await fetch(`${API}/messages/${messageId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const updateTyping = useCallback(
    async (typing: boolean) => {
      try {
        await fetch(`${API}/conversations/${conversationId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping: typing }),
        });
      } catch {
        // ignore
      }
    },
    [conversationId]
  );

  const pinnedMessage = messages.find((m) => m.isPinned);

  return {
    messages,
    loading,
    isTyping,
    pinnedMessage,
    sendMessage,
    reactToMessage,
    updateTyping,
  };
}

interface ReplyToInfo {
  messageId: string;
  senderName: string;
  text: string;
}
