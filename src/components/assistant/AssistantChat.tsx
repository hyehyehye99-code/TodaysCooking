"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { useAssistantChat } from "@/lib/assistant/useAssistantChat";
import { MessageBubble } from "@/components/assistant/MessageBubble";
import { LiveProgress } from "@/components/assistant/LiveProgress";
import { ChefAvatar } from "@/components/assistant/ChefAvatar";
import { UsageChip, UsageNudge } from "@/components/assistant/UsageMeter";
import type { AssistantUsage } from "@/lib/assistant/types";

type QuickStart = {
  mascot: "reading-recipe" | "fridge-open";
  title: string;
  desc: string;
  fill?: string;
  hint?: string;
  send?: string;
};

const QUICK_STARTS: QuickStart[] = [
  {
    mascot: "reading-recipe",
    title: "링크로 레시피 등록",
    desc: "유튜브·인스타 링크만 붙여넣으면 끝",
    fill: "",
    hint: "유튜브·인스타 링크를 붙여넣어 주세요",
  },
  {
    mascot: "fridge-open",
    title: "냉장고 파먹기",
    desc: "유통기한 임박한 재료부터 활용해요",
    // The assistant already sees the fridge, so this sends straight away.
    send: "냉장고에 있는 재료로, 유통기한 임박한 것부터 써서 만들 수 있는 요리 추천해줘",
  },
];

export function AssistantChat({ initialUsage }: { initialUsage: AssistantUsage }) {
  const { usage, limitReached, messages, pending, notice, clearNotice, send, addShopping, saveIdea, reset } = useAssistantChat(initialUsage);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Nothing to follow while the welcome screen is showing — scrolling it to
    // the bottom on mount cut the mascot off the top on short windows.
    if (messages.length === 0 && !pending) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(clearNotice, 2800);
    return () => clearTimeout(t);
  }, [notice, clearNotice]);

  // Tells the rest of the app (tab bar) the keyboard is up; always cleared on leave.
  useEffect(() => {
    const root = document.documentElement;
    if (focused) root.dataset.keyboard = "open";
    else delete root.dataset.keyboard;
    return () => {
      delete root.dataset.keyboard;
    };
  }, [focused]);

  // Grow with the text (up to ~4 lines) instead of clipping a wrapped second line.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [input]);

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

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) fill(text.trim());
    } catch {
      inputRef.current?.focus(); // clipboard blocked: let the user paste by hand
    }
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const empty = messages.length === 0 && !pending;
  // Short viewport while typing: drop the hero so the quick-start cards stay in view.
  const compactEmpty = empty && focused;

  return (
    // Fills the area under the page padding that (app)/layout.tsx adds, so the
    // input bar stays pinned above the tab bar while only the list scrolls.
    <div className="relative -mx-5 -mt-4 -mb-[max(env(safe-area-inset-bottom),40px)] flex h-[calc(100dvh-var(--app-tab-bar-height)-max(env(safe-area-inset-top),24px))] flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex shrink-0 items-center gap-3 px-5 pb-3 pt-3">
        <ChefAvatar size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-stone-800">
            혜콩이네 AI 셰프
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            주방에서 대기 중
          </p>
        </div>
        <UsageChip usage={usage} />
        {!empty && (
          <button
            type="button"
            onClick={() => {
              reset();
              setInput("");
            }}
            aria-label="대화 리셋"
            className="flex size-9 items-center justify-center rounded-full border border-stone-200/70 bg-white text-stone-500 shadow-sm active:scale-90"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>
        )}
      </header>

      {/* Stops the tab-wide pull-to-refresh from claiming drags that start in the list. */}
      <div
        ref={scrollRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-2"
      >
        {empty ? (
          <div className="flex min-h-full flex-col items-center py-4 text-center">
            {!compactEmpty && (
              <>
                <div className="relative mt-auto">
                  <span aria-hidden className="absolute inset-x-2 bottom-0 top-6 rounded-full bg-accent/10 blur-2xl" />
                  <Mascot name="chef-greeting" size={124} className="relative" />
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-stone-800">오늘은 뭘 채워볼까요?</h2>
                <p className="mt-2 max-w-[19rem] text-[14px] leading-relaxed text-stone-500">
                  어떤 요리를 혜콩이네 주방에 채워볼까요? 유튜브·인스타 링크를 보내주시거나, 냉장고에 있는 재료를 알려주세요!
                </p>
              </>
            )}
            <div className={`mb-auto flex w-full flex-col gap-2.5 ${compactEmpty ? "mt-auto" : "mt-6"}`}>
              {QUICK_STARTS.map((q) => (
                <button
                  key={q.title}
                  type="button"
                  onClick={() => (q.send ? send(q.send) : fill(q.fill ?? "", q.hint))}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                    <Mascot name={q.mascot} size={38} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-stone-800">{q.title}</span>
                    <span className="block text-xs text-stone-500">{q.desc}</span>
                  </span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
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
          className="absolute inset-x-0 bottom-24 z-20 mx-auto w-fit max-w-[85%] rounded-full bg-stone-800 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg"
        >
          {notice}
        </p>
      )}

      <UsageNudge usage={usage} limitReached={limitReached} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative z-10 shrink-0 px-4 pb-3 pt-1"
      >
        <div className="flex items-end gap-1 rounded-[26px] border border-stone-200/70 bg-white p-1.5 shadow-md">
          <button
            type="button"
            onClick={paste}
            aria-label="클립보드에서 링크 붙여넣기"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-stone-400 active:scale-90 active:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" />
              <path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={600}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={hint ?? "링크, 재료, 궁금한 점을 적어주세요"}
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-base leading-snug text-stone-800 no-focus-ring outline-none placeholder:text-stone-400"
          />
          <button
            type="submit"
            aria-label="보내기"
            disabled={!input.trim() || !!pending}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-sm transition active:scale-90 disabled:bg-stone-200 disabled:shadow-none"
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
