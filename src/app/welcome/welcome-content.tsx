"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";

const SAMPLE_RECIPES = [
  { name: "비프 부르기뇽", tag: "#프랑스" },
  { name: "짜글이", tag: "#한식" },
  { name: "광어 세비체", tag: "#홈파티" },
  { name: "비프 웰링턴", tag: "#홈파티" },
  { name: "크림브륄레", tag: "#디저트" },
  { name: "된장찌개", tag: "#한식" },
  { name: "김치볶음밥", tag: "#간단요리" },
];

const AI_INGREDIENTS = ["살치살 400g", "트러플 소금", "백후추", "올리브유", "통마늘", "방울 토마토", "양송이 버섯", "미니 아스파라거스", "와사비"];
const AI_INSTRUCTIONS = "1. 키친타월로 핏물을 깔끔히 제거합니다.\n2. 소금 후추를 앞뒤로 발라 밑간을 합니다.\n3. 팬에 올리브 오일을 두르고 중약불로 고기를 구워줍니다.";

// Points at whichever element the slide wants the user to actually tap —
// the subtext already says so in words, but a bouncing badge is what makes
// people realize the demo is real and not just a screenshot.
function TapHint() {
  return (
    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce text-lg leading-none">
      👆
    </span>
  );
}

function RecipeListDemo({ onNext }: { onNext: () => void }) {
  return (
    <GlassCard className="mx-auto w-full bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-bold text-ink">메뉴판</p>
        <span className="relative inline-block">
          <button type="button" onClick={onNext} className="text-xs font-bold text-accent">
            + 새 메뉴
          </button>
          <TapHint />
        </span>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {SAMPLE_RECIPES.map((r) => (
          <div key={r.name} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-surface" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{r.name}</p>
              <p className="truncate text-[10px] text-ink-faint">{r.tag}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function RecipeCollectDemo() {
  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");

  function runAi() {
    setPhase("loading");
    setTimeout(() => setPhase("result"), 900);
  }

  return (
    <GlassCard className="mx-auto w-full bg-white p-4">
      <p className="mb-1 text-xs font-bold text-ink-soft">요리 이름</p>
      <div className="mb-3 rounded-xl bg-surface px-3.5 py-2.5 text-sm font-bold text-ink">스테이크 굽는 법</div>

      <p className="mb-1 text-xs font-bold text-ink-soft">참고 링크</p>
      <div className="mb-3 rounded-xl bg-surface p-2.5">
        <p className="mb-2 truncate text-xs text-ink-soft">youtube.com/shorts/ReaQrFMWh7c</p>
        <div className="flex gap-2 rounded-lg bg-white p-1.5">
          <div className="h-10 w-10 shrink-0 rounded-md bg-ink/10" />
          <p className="line-clamp-2 text-[11px] leading-snug text-ink-soft">
            인스타 200만뷰 라면보다 쉬운 스테이크 굽는 법! #shorts #스테이크
          </p>
        </div>
      </div>

      <div className="relative mb-3">
        <button
          type="button"
          onClick={runAi}
          disabled={phase !== "form"}
          className="w-full rounded-xl border border-accent py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
        >
          {phase === "form" && "✨ AI로 재료·레시피 자동 작성"}
          {phase === "loading" && "AI가 작성하는 중..."}
          {phase === "result" && "✓ AI가 작성했어요"}
        </button>
        {phase === "form" && <TapHint />}
      </div>

      <p className="mb-1 text-xs font-bold text-ink-soft">재료</p>
      <div className="min-h-[88px] rounded-xl bg-surface p-2.5 text-xs leading-relaxed text-ink">
        {phase === "result" ? (
          <div className="animate-fade-in-up flex flex-wrap gap-1.5">
            {AI_INGREDIENTS.map((item) => (
              <span key={item} className="rounded-full bg-white px-2.5 py-1 font-semibold text-ink">
                {item}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-ink-faint">한 줄에 하나씩 입력해주세요</span>
        )}
      </div>

      {phase === "result" && (
        <div className="animate-fade-in-up mt-3">
          <p className="mb-1 text-xs font-bold text-ink-soft">만드는법</p>
          <p className="whitespace-pre-line rounded-xl bg-surface p-2.5 text-xs leading-relaxed text-ink">
            {AI_INSTRUCTIONS}
          </p>
        </div>
      )}
    </GlassCard>
  );
}

const SHOPPING_ITEMS = ["살치살", "트러플 소금", "백후추", "통마늘", "방울 토마토", "양송이 버섯", "미니 아스파라거스"];

const OWNED_INGREDIENTS = new Set(["방울 토마토", "와사비"]);

const CONFIRM_STATES = ["shopping", "fridge", "skip"] as const;
type ConfirmState = (typeof CONFIRM_STATES)[number];
const CONFIRM_LABELS: Record<ConfirmState, string> = { shopping: "구매 필요", fridge: "보유 중", skip: "생략" };
const CONFIRM_STYLES: Record<ConfirmState, string> = {
  shopping: "bg-accent text-white",
  fridge: "bg-positive text-white",
  skip: "bg-ink-soft text-white",
};

function ShoppingSyncDemo() {
  const [phase, setPhase] = useState<"detail" | "confirm" | "done">("detail");
  const [choices, setChoices] = useState<Record<string, ConfirmState>>(
    () => Object.fromEntries(SHOPPING_ITEMS.map((item) => [item, "shopping"])) as Record<string, ConfirmState>
  );
  const shoppingList = SHOPPING_ITEMS.filter((item) => choices[item] === "shopping");

  return (
    <>
      <GlassCard className="mx-auto w-full bg-white p-4">
        {phase === "confirm" ? (
          <div className="animate-fade-in-up">
            <p className="mb-1 text-[15px] font-bold">부족한 재료 확인</p>
            <p className="mb-3 text-xs text-ink-soft">
              이미 있는 재료는 냉장고로, 필요 없는 재료는 생략으로 표시하고, 나머지만 장보기에
              담을게요.
            </p>
            <div className="mb-4 flex max-h-[220px] flex-col gap-2 overflow-y-auto">
              {SHOPPING_ITEMS.map((item) => (
                <div key={item} className="rounded-xl bg-surface px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{item}</span>
                    <div className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-white p-0.5">
                      {CONFIRM_STATES.map((state) => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => setChoices((c) => ({ ...c, [item]: state }))}
                          className={`whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] font-bold ${
                            choices[item] === state ? CONFIRM_STYLES[state] : "text-ink-soft"
                          }`}
                        >
                          {CONFIRM_LABELS[state]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPhase("detail")}
                className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setPhase("done")}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white"
              >
                담기
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-1 text-[15px] font-bold text-ink">스테이크 굽는 법</p>
            <p className="mb-2 text-xs text-ink-soft">2/9 보유 중 · 재료</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {AI_INGREDIENTS.map((item) => {
                const isOwned = OWNED_INGREDIENTS.has(item);
                const onList = phase === "done" && !isOwned;
                return (
                  <span
                    key={item}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      isOwned
                        ? "border-accent bg-surface text-accent-ink"
                        : onList
                          ? "border-positive bg-surface text-positive-ink"
                          : "border-transparent bg-surface text-ink-soft"
                    }`}
                  >
                    {item}
                  </span>
                );
              })}
            </div>

            {phase === "done" ? (
              <div className="rounded-xl bg-surface py-2.5 text-center text-xs font-bold text-ink-faint">
                장보기에 담겨 있어요
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPhase("confirm")}
                  className="w-full rounded-xl bg-accent py-2.5 text-xs font-bold text-white"
                >
                  부족한 재료 장보기 담기
                </button>
                <TapHint />
              </div>
            )}
          </>
        )}
      </GlassCard>

      {phase === "done" && (
        <div className="animate-fade-in-up mx-auto mt-3 w-full">
          <p className="mb-1.5 text-xs font-bold text-ink-soft">장보기</p>
          <GlassCard className="bg-white p-3">
            <div className="flex flex-col divide-y divide-border">
              {shoppingList.map((item) => (
                <div key={item} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="h-4 w-4 shrink-0 rounded border border-border bg-surface" />
                  <span className="text-xs font-semibold text-ink">{item}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}

const FRIDGE_CATEGORIES = [
  { name: "채소", items: ["양파", "대파", "당근", "감자", "청양고추", "쪽파"], owned: ["양파", "대파", "당근", "감자", "청양고추"] },
  { name: "해산물", items: ["새우", "오징어", "문어", "낙지", "바지락"], owned: ["새우", "오징어", "문어"] },
];

function FridgeDemo() {
  const [owned, setOwned] = useState<Set<string>>(
    () => new Set(FRIDGE_CATEGORIES.flatMap((c) => c.owned))
  );

  function toggle(name: string) {
    setOwned((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <GlassCard className="mx-auto w-full bg-white p-4">
      <p className="mb-4 text-xs text-ink-faint">탭하면 바로 추가되거나 빠져요</p>
      <div className="flex flex-col gap-4">
        {FRIDGE_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="mb-2 text-xs font-bold text-ink-soft">{cat.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => {
                const active = owned.has(item);
                const isHintTarget = cat.name === "채소" && item === "쪽파";
                return (
                  <span key={item} className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      className={`rounded-full border border-transparent px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                        active ? "bg-accent text-white" : "bg-surface text-ink-soft"
                      }`}
                    >
                      {item}
                    </button>
                    {isHintTarget && !active && <TapHint />}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

const HOUSEHOLD_MEMBERS = [
  { name: "혜동세프", role: "대장 (나)" },
  { name: "콩이세프", role: null },
];

function HouseholdShareDemo() {
  return (
    <GlassCard className="mx-auto w-full bg-white p-4 ring-2 ring-accent">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">혜콩이네 🏠</span>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">사용 중</span>
      </div>
      <p className="mb-2 text-xs font-bold text-ink-soft">참여 인원 (2명)</p>
      <div className="flex flex-col gap-2">
        {HOUSEHOLD_MEMBERS.map((m) => (
          <div key={m.name} className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-white" />
            <div>
              <p className="text-xs font-bold text-ink">{m.name}</p>
              {m.role && <p className="text-[10px] text-accent-ink">{m.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

const SLIDES = [
  {
    headline: "여기저기 흩어진 레시피, 한곳에 모아보세요",
    subtext: "새 메뉴를 눌러 등록을 시작해보세요",
    render: (onNext: () => void) => <RecipeListDemo onNext={onNext} />,
  },
  {
    headline: "링크 하나만 넣으면 AI가 알아서 정리해줘요",
    subtext: "AI로 재료·레시피 자동 작성 버튼을 눌러보세요",
    render: () => <RecipeCollectDemo />,
  },
  {
    headline: "부족한 재료는 장보기에 자동으로",
    subtext: "장보기를 끝내면 냉장고에도 알아서 채워져요. 버튼을 눌러보세요",
    render: () => <ShoppingSyncDemo />,
  },
  {
    headline: "냉장고에 있는 재료, 탭 한 번으로 체크",
    subtext: "직접 눌러보세요",
    render: () => <FridgeDemo />,
  },
  {
    headline: "가족과 함께 관리해요",
    subtext: "부엌은 여럿이 같이 쓰고, 초대 링크로 간편하게 초대할 수 있어요",
    render: () => <HouseholdShareDemo />,
  },
];

export function WelcomeContent() {
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;
  const isFirst = slideIndex === 0;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col px-7 pt-[max(env(safe-area-inset-top),32px)] pb-[max(env(safe-area-inset-bottom),32px)]">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
          aria-label="이전"
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-soft ${
            isFirst ? "invisible" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === slideIndex ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>

        <Link href="/login" className="text-xs font-bold text-ink-faint">
          건너뛰기
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <h1 className="mb-2 text-xl font-bold leading-snug text-ink">{slide.headline}</h1>
        <p className="mb-6 text-sm text-ink-soft">{slide.subtext}</p>

        <div key={slideIndex}>{slide.render(() => setSlideIndex((i) => i + 1))}</div>
      </div>

      <div className="mt-6">
        {isLast ? (
          <Link
            href="/login"
            className="block w-full rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
          >
            지금 시작해볼까요?
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setSlideIndex((i) => i + 1)}
            className="w-full rounded-xl bg-accent py-4 text-sm font-bold text-white"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
