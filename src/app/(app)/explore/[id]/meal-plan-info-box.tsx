"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { renderMealPlanCard, type MealPlanCardRecipe } from "./meal-plan-card-image";
import { useDict, useLocale } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/locales";

const LOCALE_TAGS: Record<Locale, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP" };

function formatEventDateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
  }).format(new Date(iso));
}

export function MealPlanInfoBox({
  mealPlanId,
  title,
  eventDate,
  headcount,
  cardRecipes,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  mealPlanId: string;
  title: string;
  eventDate: string | null;
  headcount: number | null;
  cardRecipes: MealPlanCardRecipe[];
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const dict = useDict();
  const locale = useLocale();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function generateAndShare() {
    setGenerating(true);
    const result = await renderMealPlanCard({
      title,
      eventDateLabel: eventDate ? formatEventDateTime(eventDate, locale) : null,
      headcountLabel: headcount ? `${headcount}${dict.mealPlan.headcountSuffix}` : null,
      recipes: cardRecipes,
    });
    setGenerating(false);
    if (!result) return;
    setBlob(result);
    setPreviewUrl(URL.createObjectURL(result));
  }

  function closePreview() {
    setPreviewUrl(null);
    setBlob(null);
  }

  async function share() {
    if (!blob) return;
    setSharing(true);
    const file = new File([blob], "meal-plan.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else if (previewUrl) {
        // No file-sharing support (rare) — open it full-size so it can at
        // least be long-pressed and saved.
        window.open(previewUrl, "_blank");
      }
    } catch {
      // Includes the user dismissing the share sheet — nothing to show.
    }
    setSharing(false);
  }

  return (
    <GlassCard className="mb-4 bg-accent/8 p-4">
      <div className="flex items-center gap-1.5">
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h2>
        <Link
          href={`/explore/${mealPlanId}/edit`}
          aria-label={dict.mealPlan.editMealPlanButton}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink-soft"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label={dict.mealPlan.prevPlan}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1 text-center text-xs text-ink-soft">
          {eventDate && (
            <p>{dict.mealPlan.eventDateLineTemplate.replace("{date}", formatEventDateTime(eventDate, locale))}</p>
          )}
          {headcount != null && (
            <p>{dict.mealPlan.headcountLineTemplate.replace("{count}", String(headcount))}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label={dict.mealPlan.nextPlan}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/explore/${mealPlanId}/edit`}
          className="flex-1 rounded-xl bg-white py-2.5 text-center text-xs font-bold text-ink"
        >
          {dict.mealPlan.editMealPlanButton}
        </Link>
        <button
          type="button"
          onClick={generateAndShare}
          disabled={generating || cardRecipes.length === 0}
          className="flex-1 rounded-xl bg-white py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
        >
          {generating ? dict.mealPlan.creatingEllipsis : dict.mealPlan.shareCardButton}
        </button>
      </div>

      <Modal open={!!previewUrl} onClose={closePreview} variant="sheet">
        <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="max-h-[60vh] w-full rounded-xl border border-border object-contain" />
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={closePreview}
              className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
            >
              {dict.common.close}
            </button>
            <button
              type="button"
              onClick={share}
              disabled={sharing}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {dict.mealPlan.shareCardButton}
            </button>
          </div>
        </div>
      </Modal>
    </GlassCard>
  );
}
