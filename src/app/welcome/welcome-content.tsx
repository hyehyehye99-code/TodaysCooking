"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { useDict } from "@/lib/i18n/client";

const SAMPLE_RECIPES = [
  { name: "비프 부르기뇽", tag: "#프랑스", emoji: "🍷" },
  { name: "짜글이", tag: "#한식", emoji: "🍲" },
  { name: "광어 세비체", tag: "#홈파티", emoji: "🐟" },
  { name: "비프 웰링턴", tag: "#홈파티", emoji: "🥩" },
  { name: "크림브륄레", tag: "#디저트", emoji: "🍮" },
  { name: "된장찌개", tag: "#한식", emoji: "🥣" },
  { name: "김치볶음밥", tag: "#간단요리", emoji: "🍚" },
];

const AI_INGREDIENTS = ["살치살 400g", "트러플 소금", "백후추", "올리브유", "통마늘", "방울 토마토", "양송이 버섯", "미니 아스파라거스", "와사비"];
const AI_INSTRUCTIONS = "1. 키친타월로 핏물을 깔끔히 제거합니다.\n2. 소금 후추를 앞뒤로 발라 밑간을 합니다.\n3. 팬에 올리브 오일을 두르고 중약불로 고기를 구워줍니다.";

// Points at whichever element the slide wants the user to actually tap —
// the subtext already says so in words, but a highlight is what makes
// people realize the demo is real and not just a screenshot. Sized via
// inset-0 against the nearest `relative` ancestor (the target itself)
// instead of an offset + translate — that way it can't drift off the
// target the way a corner-positioned icon did on real devices.
// animate-ping scales the ring past the element's own box, which got
// clipped by an ancestor's rounded corners/overflow — animate-pulse instead
// just fades the same fixed-size ring in and out, so it never grows past
// where it's drawn.
function TapHint({ rounded = "rounded-xl" }: { rounded?: string }) {
  return (
    <span
      className={`pointer-events-none absolute inset-0 ${rounded} ring-2 ring-accent animate-pulse`}
    />
  );
}

function RecipeListDemo({ onNext }: { onNext: () => void }) {
  const dict = useDict();
  return (
    <GlassCard className="mx-auto w-full bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-bold text-ink">{dict.welcome.menuBoard}</p>
        <span className="relative inline-block">
          <button type="button" onClick={onNext} className="text-xs font-bold text-accent">
            {dict.welcome.newMenu}
          </button>
          <TapHint />
        </span>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {SAMPLE_RECIPES.map((r) => (
          <div key={r.name} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-lg">
              {r.emoji}
            </div>
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
  const dict = useDict();
  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");

  function runAi() {
    setPhase("loading");
    setTimeout(() => setPhase("result"), 900);
  }

  return (
    <GlassCard className="mx-auto w-full bg-white p-4">
      <p className="mb-1 text-xs font-bold text-ink-soft">{dict.welcome.dishName}</p>
      <div className="mb-3 rounded-xl bg-surface px-3.5 py-2.5 text-sm font-bold text-ink">{dict.welcome.demoDish}</div>

      <p className="mb-1 text-xs font-bold text-ink-soft">{dict.welcome.referenceLink}</p>
      <div className="mb-3 rounded-xl bg-surface p-2.5">
        <p className="mb-2 truncate text-xs text-ink-soft">youtube.com/shorts</p>
        <div className="flex gap-2 rounded-lg bg-white p-1.5">
          <div className="h-10 w-10 shrink-0 rounded-md bg-ink/10" />
          <p className="line-clamp-2 text-[11px] leading-snug text-ink-soft">{dict.welcome.demoDish}</p>
        </div>
      </div>

      <div className="relative mb-3">
        <button
          type="button"
          onClick={runAi}
          disabled={phase !== "form"}
          className="w-full rounded-xl border border-accent py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
        >
          {phase === "form" && dict.welcome.aiFillButton}
          {phase === "loading" && dict.welcome.aiFillLoading}
          {phase === "result" && dict.welcome.aiFillDone}
        </button>
        {phase === "form" && <TapHint />}
      </div>

      <p className="mb-1 text-xs font-bold text-ink-soft">{dict.welcome.ingredients}</p>
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
          <span className="text-ink-faint">{dict.welcome.ingredientsPlaceholder}</span>
        )}
      </div>

      {phase === "result" && (
        <div className="animate-fade-in-up mt-3">
          <p className="mb-1 text-xs font-bold text-ink-soft">{dict.welcome.instructions}</p>
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
const CONFIRM_STYLES: Record<ConfirmState, string> = {
  shopping: "bg-accent text-white",
  fridge: "bg-positive text-white",
  skip: "bg-ink-soft text-white",
};

function ShoppingSyncDemo() {
  const dict = useDict();
  const confirmLabels: Record<ConfirmState, string> = {
    shopping: dict.welcome.stateShopping,
    fridge: dict.welcome.stateFridge,
    skip: dict.welcome.stateSkip,
  };
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
            <p className="mb-1 text-[15px] font-bold">{dict.welcome.missingIngredientsTitle}</p>
            <p className="mb-3 text-xs text-ink-soft">{dict.welcome.missingIngredientsDesc}</p>
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
                          {confirmLabels[state]}
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
                {dict.welcome.modalCancel}
              </button>
              <button
                type="button"
                onClick={() => setPhase("done")}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white"
              >
                {dict.welcome.modalConfirm}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-1 text-[15px] font-bold text-ink">{dict.welcome.demoDish}</p>
            <p className="mb-2 text-xs text-ink-soft">2/9 {dict.welcome.stateFridge} · {dict.welcome.ingredients}</p>
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
                {dict.welcome.addedToShoppingList}
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPhase("confirm")}
                  className="w-full rounded-xl bg-accent py-2.5 text-xs font-bold text-white"
                >
                  {dict.welcome.addToShoppingList}
                </button>
                <TapHint />
              </div>
            )}
          </>
        )}
      </GlassCard>

      {phase === "done" && (
        <div className="animate-fade-in-up mx-auto mt-3 w-full">
          <p className="mb-1.5 text-xs font-bold text-ink-soft">{dict.welcome.shoppingList}</p>
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
  const dict = useDict();
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
      <p className="mb-4 text-xs text-ink-faint">{dict.welcome.tapToToggle}</p>
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
                    {isHintTarget && !active && <TapHint rounded="rounded-full" />}
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
  { name: "혜동세프", emoji: "🧑‍🍳", isOwner: true },
  { name: "콩이세프", emoji: "👩‍🍳", isOwner: false },
];

function HouseholdShareDemo() {
  const dict = useDict();
  return (
    <GlassCard className="mx-auto w-full bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">{dict.welcome.householdName}</span>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">{dict.welcome.inUse}</span>
      </div>
      <p className="mb-2 text-xs font-bold text-ink-soft">{dict.welcome.members}</p>
      <div className="flex flex-col gap-2">
        {HOUSEHOLD_MEMBERS.map((m) => (
          <div key={m.name} className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base">
              {m.emoji}
            </div>
            <div>
              <p className="text-xs font-bold text-ink">{m.name}</p>
              {m.isOwner && <p className="text-[10px] text-accent-ink">{dict.welcome.ownerLabel}</p>}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function WelcomeContent() {
  const dict = useDict();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    {
      headline: dict.welcome.slide1Headline,
      subtext: dict.welcome.slide1Subtext,
      render: (onNext: () => void) => <RecipeListDemo onNext={onNext} />,
    },
    {
      headline: dict.welcome.slide2Headline,
      subtext: dict.welcome.slide2Subtext,
      render: () => <RecipeCollectDemo />,
    },
    {
      headline: dict.welcome.slide3Headline,
      subtext: dict.welcome.slide3Subtext,
      render: () => <ShoppingSyncDemo />,
    },
    {
      headline: dict.welcome.slide4Headline,
      subtext: dict.welcome.slide4Subtext,
      render: () => <FridgeDemo />,
    },
    {
      headline: dict.welcome.slide5Headline,
      subtext: dict.welcome.slide5Subtext,
      render: () => <HouseholdShareDemo />,
    },
  ];

  const slide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;
  const isFirst = slideIndex === 0;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col px-7 pt-[calc(max(env(safe-area-inset-top),32px)+16px)] pb-[max(env(safe-area-inset-bottom),32px)]">
      <div className="mb-9 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
          aria-label={dict.welcome.prev}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-soft ${
            isFirst ? "invisible" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === slideIndex ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>

        <Link href="/login" className="text-xs font-bold text-ink-faint">
          {dict.welcome.skip}
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <h1 className="mb-2 text-xl font-bold leading-snug text-ink">{slide.headline}</h1>
        <p className="mb-4 text-sm text-ink-soft">{slide.subtext}</p>

        <div key={slideIndex}>{slide.render(() => setSlideIndex((i) => i + 1))}</div>
      </div>

      <div className="mt-4">
        {isLast ? (
          <Link
            href="/login"
            className="block w-full rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
          >
            {dict.welcome.start}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setSlideIndex((i) => i + 1)}
            className="w-full rounded-xl bg-accent py-4 text-sm font-bold text-white"
          >
            {dict.welcome.next}
          </button>
        )}
      </div>
    </div>
  );
}
