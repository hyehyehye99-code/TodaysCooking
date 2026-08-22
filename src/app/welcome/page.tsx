"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Hotspot = { top: string; left: string };
type Step = { image: string; hotspot?: Hotspot; auto?: boolean };
type ImageSlide = {
  kind: "images";
  headline: string;
  subtext: string;
  steps: Step[];
};
type FridgeSlide = { kind: "fridge"; headline: string; subtext: string };
type Slide = ImageSlide | FridgeSlide;

const SLIDES: Slide[] = [
  {
    kind: "images",
    headline: "여기저기 흩어진 레시피, 한곳에 모아보세요",
    subtext: "링크 하나만 넣으면 재료랑 만드는 법을 AI가 알아서 정리해줘요",
    steps: [
      { image: "/onboarding/recipe-list.png", hotspot: { top: "20%", left: "82%" } },
      { image: "/onboarding/new-recipe-form.png", hotspot: { top: "49%", left: "50%" } },
      { image: "/onboarding/ai-loading.png", auto: true },
      { image: "/onboarding/ai-result.png" },
    ],
  },
  {
    kind: "images",
    headline: "부족한 재료는 장보기에 자동으로",
    subtext: "장보기를 끝내면 냉장고에도 알아서 채워져요",
    steps: [
      { image: "/onboarding/recipe-detail-need-shopping.png", hotspot: { top: "51%", left: "50%" } },
      { image: "/onboarding/missing-ingredients-modal.png", hotspot: { top: "88%", left: "74%" } },
      { image: "/onboarding/recipe-detail-added.png", auto: true },
      { image: "/onboarding/shopping-list.png" },
    ],
  },
  {
    kind: "fridge",
    headline: "냉장고에 있는 재료, 탭 한 번으로 체크",
    subtext: "직접 눌러보세요",
  },
  {
    kind: "images",
    headline: "가족과 함께 관리해요",
    subtext: "부엌은 여럿이 같이 쓰고, 초대 링크로 간편하게 초대할 수 있어요",
    steps: [
      { image: "/onboarding/mypage-household.png", hotspot: { top: "50%", left: "84%" } },
      { image: "/onboarding/invite-modal.png", hotspot: { top: "83%", left: "50%" } },
      { image: "/onboarding/household-info-modal.png" },
    ],
  },
];

const AUTO_ADVANCE_MS = 700;

function Hotspot({ top, left }: Hotspot) {
  return (
    <span
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ top, left }}
    >
      <span className="absolute inset-0 m-auto h-10 w-10 animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative block h-5 w-5 rounded-full bg-accent" />
    </span>
  );
}

function PhoneShot({ step, onAdvance }: { step: Step; onAdvance: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAdvance}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onAdvance();
      }}
      className="relative mx-auto w-full max-w-[240px] cursor-pointer select-none"
      style={{ aspectRatio: "466 / 893" }}
    >
      <Image src={step.image} alt="" fill className="object-contain" draggable={false} priority />
      {step.hotspot && <Hotspot {...step.hotspot} />}
    </div>
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
    <div className="mx-auto w-full max-w-[280px] rounded-[28px] border border-border bg-white p-5 shadow-[0_20px_60px_-24px_rgba(25,31,40,0.25)]">
      <p className="mb-4 text-xs text-ink-faint">탭하면 바로 추가되거나 빠져요</p>
      <div className="flex flex-col gap-4">
        {FRIDGE_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="mb-2 text-xs font-bold text-ink-soft">{cat.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => {
                const active = owned.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(item)}
                    className={`rounded-full border border-transparent px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                      active ? "bg-accent text-white" : "bg-surface text-ink-soft"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;

  const currentStep = slide.kind === "images" ? slide.steps[stepIndex] : null;

  useEffect(() => {
    if (!currentStep?.auto) return;
    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [currentStep]);

  function goToSlide(next: number) {
    setSlideIndex(next);
    setStepIndex(0);
  }

  function advanceStep() {
    if (slide.kind !== "images") return;
    if (stepIndex < slide.steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  const atLastStep = slide.kind === "fridge" || stepIndex === slide.steps.length - 1;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col px-7 pt-[max(env(safe-area-inset-top),32px)] pb-[max(env(safe-area-inset-bottom),32px)]">
      <div className="mb-6 flex items-center justify-between">
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

      <div className="flex-1 overflow-y-auto">
        <h1 className="mb-2 text-xl font-bold leading-snug text-ink">{slide.headline}</h1>
        <p className="mb-6 text-sm text-ink-soft">{slide.subtext}</p>

        {slide.kind === "images" && currentStep && (
          <PhoneShot step={currentStep} onAdvance={advanceStep} />
        )}
        {slide.kind === "fridge" && <FridgeDemo />}
      </div>

      <div className="mt-6">
        {isLast && atLastStep ? (
          <Link
            href="/login"
            className="block w-full rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
          >
            지금 시작해볼까요?
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => goToSlide(slideIndex + 1)}
            disabled={!atLastStep}
            className="w-full rounded-xl bg-accent py-4 text-sm font-bold text-white disabled:opacity-40"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
