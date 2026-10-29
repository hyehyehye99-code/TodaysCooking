"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AssistantAction,
  AssistantIdea,
  AssistantReply,
  AssistantStreamEvent,
  AssistantUsage,
  ChatMessage,
} from "@/lib/assistant/types";

const STORAGE_KEY = "assistant-chat-v1";
const ENDPOINT = "/api/ai/assistant";
const URL_PATTERN = /https?:\/\/\S+/i;

const newId = () => Math.random().toString(36).slice(2);
const errorReply = (text: string): AssistantReply => ({ text, recipes: [], ideas: [], actions: [] });

// Read/written in try/catch: storage can be blocked or empty (private windows,
// native webviews) and the chat must work without it.
function loadSaved(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function useAssistantChat(initialUsage: AssistantUsage) {
  const [usage, setUsage] = useState(initialUsage);
  const [limitReached, setLimitReached] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<{ isLink: boolean; step: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    // Restoring from sessionStorage can only happen after mount (SSR has none).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(loadSaved());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || pending) return;

      const userMsg: ChatMessage = { id: newId(), role: "user", text };
      const next = [...messages, userMsg];
      setMessages(next);
      setPending({ isLink: URL_PATTERN.test(text), step: 1 });

      const finish = (reply: AssistantReply, error = false) =>
        setMessages((m) => [...m, { id: newId(), role: "assistant", reply, error }]);

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "chat",
            messages: next.map((m) =>
              m.role === "user" ? { role: "user", text: m.text } : { role: "assistant", text: m.reply.text }
            ),
          }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          finish(errorReply(data?.error ?? "문제가 생겼어요. 잠시 후 다시 시도해주세요."), true);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let settled = false;
        const handle = (line: string) => {
          if (!line.trim()) return;
          const event = JSON.parse(line) as AssistantStreamEvent;
          if ("usage" in event && event.usage) setUsage(event.usage);
          if (event.type === "error") setLimitReached(!!event.limitReached);
          else if (event.type === "result") setLimitReached(false);
          if (event.type === "step") setPending((p) => (p ? { ...p, step: event.step } : p));
          else if (event.type === "result") {
            settled = true;
            finish(event.reply);
          } else {
            settled = true;
            finish(errorReply(event.error), true);
          }
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handle);
        }
        handle(buffer);
        if (!settled) finish(errorReply("답변을 받지 못했어요. 다시 시도해주세요."), true);
      } catch {
        finish(errorReply("네트워크 연결을 확인하고 다시 시도해주세요."), true);
      } finally {
        setPending(null);
      }
    },
    [messages, pending]
  );

  const post = useCallback(async (body: object) => {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true as const, data } : { ok: false as const, error: (data.error as string) ?? "실패했어요." };
  }, []);

  const addShopping = useCallback(
    async (action: Extract<AssistantAction, { kind: "add_shopping" }>) => {
      const r = await post({ kind: "add_shopping", items: action.items });
      setNotice(
        r.ok
          ? r.data.added > 0
            ? `🛒 ${r.data.added}개 재료를 장보기 목록에 담았어요`
            : "이미 장보기 목록에 다 담겨 있어요"
          : r.error
      );
      return r.ok;
    },
    [post]
  );

  const saveIdea = useCallback(
    async (idea: AssistantIdea) => {
      const r = await post({ kind: "save_idea", idea });
      if (!r.ok) setNotice(r.error);
      return r.ok ? (r.data.id as string) : null;
    },
    [post]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setNotice(null);
  }, []);

  return { usage, limitReached, messages, pending, notice, clearNotice: () => setNotice(null), send, addShopping, saveIdea, reset };
}
