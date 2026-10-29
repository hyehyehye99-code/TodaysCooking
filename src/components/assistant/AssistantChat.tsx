"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { useAssistantChat } from "@/lib/assistant/useAssistantChat";
import { MessageBubble } from "@/components/assistant/MessageBubble";
import { LiveProgress } from "@/components/assistant/LiveProgress";

const QUICK_STARTS = [
  { label: "🔗 유튜브/인스타 링크 등록", fill: "" , placeholder: true },
  { label: "🥕 냉장고 파먹기 (재료로 요리 찾기)", fill: "냉장고에 있는 재료로 만들 수 있는 요리 추천해줘. 재료는: " },
  { label: "⏱️ 15분 초간단 야식 추천", fill: "15분 안에 만들 수 있는 초간단 야식 추천해줘" },
];

export function AssistantChat() {
  const { messages, pending, notice, clearNotice, send, addShopping, saveIdea, reset } = useAssistantChat();
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending?.step]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(clearNotice, 2800);
    return () => clearTimeout(t);
  }, [notice, clearNotice]);

  function submit() {
    if (!input.trim() || pending) return;
    send(input);
    setInput("");
    setHint(null);
  }

  function fill(text: string, placeholder?: string) {
    setInput(text);
    setHint(placeholder ?? null);
    inputRef.current?.focus();
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    // Fills the area under the page padding that (app)/layout.tsx adds, so the
    // input bar stays pinned above the tab bar while only the list scrolls.
    <div className="-mx-5 -mt-4 -mb-[max(env(safe-area-inset-bottom),40px)] flex h-[calc(100dvh-var(--app-tab-bar-height)-max(env(safe-area-inset-top),24px))] flex-col bg-[#FBFBFA]">
      <header className="flex shrink-0 items-center justify-between border-b border-stone-200/70 px-5 py-3">
        <h1 className="text-[17px] font-bold tracking-tight text-stone-800">혜콩이네 AI 셰프 🧑‍🍳</h1>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              reset();
              setInput("");
            }}
            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 active:scale-95"
          >
            ↺ 대화 리셋
          </button>
        )}
      </header>

      {/* Stops the tab-wide pull-to-refresh from claiming drags that start in the list. */}
      <div
        ref={scrollRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
      >
        {messages.length === 0 && !pending ? (
          <div className="flex min-h-full flex-col items-center justify-center pb-6 text-center">
            <Mascot name="chef-greeting" size={112} />
            <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-stone-600">
              어떤 요리를 혜콩이네 주방에 채워볼까요? 유튜브·인스타 링크를 보내주시거나, 냉장고에 있는 재료를 알려주세요!
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {QUICK_STARTS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => fill(q.fill, q.placeholder ? "유튜브·인스타 링크를 붙여넣어 주세요" : undefined)}
                  className="rounded-full border border-stone-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm active:scale-95"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                showActions={m.id === lastAssistantId && !pending}
                onAddShopping={addShopping}
                onSaveIdea={saveIdea}
                onPrompt={(a) => (a.mode === "send" ? send(a.prompt) : fill(a.prompt, "링크를 붙여넣어 주세요"))}
              />
            ))}
            {pending && <LiveProgress isLink={pending.isLink} step={pending.step} />}
          </div>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="mx-auto mb-2 rounded-full bg-stone-800 px-4 py-2 text-xs font-semibold text-white shadow-md"
        >
          {notice}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="shrink-0 px-4 pb-3 pt-1"
      >
        <div className="flex items-end gap-2 rounded-3xl border border-stone-200/70 bg-white py-1.5 pl-4 pr-1.5 shadow-md">
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            maxLength={600}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={hint ?? "링크를 붙여넣거나 재료·궁금한 점을 적어주세요"}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base leading-snug text-stone-800 outline-none placeholder:text-stone-400"
          />
          <button
            type="submit"
            aria-label="보내기"
            disabled={!input.trim() || !!pending}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition active:scale-90 disabled:bg-stone-200"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
