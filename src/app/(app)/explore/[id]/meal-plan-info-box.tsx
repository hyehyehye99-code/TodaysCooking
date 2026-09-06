"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { ShareDesignPicker } from "./share-design-picker";
import type { MealPlanCardRecipe } from "./meal-plan-card-image";
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
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <GlassCard className="mb-4 bg-surface p-4">
      <h2 className="truncate text-lg font-bold">{title}</h2>

      <div className="mt-2 flex items-center justify-between gap-2">
        {hasPrev ? (
          <button
            type="button"
            onClick={onPrev}
            aria-label={dict.mealPlan.prevPlan}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : (
          <span className="h-8 w-8 shrink-0" />
        )}
        <div className="min-w-0 flex-1 text-center text-xs text-ink-soft">
          {eventDate && (
            <p>{dict.mealPlan.eventDateLineTemplate.replace("{date}", formatEventDateTime(eventDate, locale))}</p>
          )}
          {headcount != null && (
            <p>{dict.mealPlan.headcountLineTemplate.replace("{count}", String(headcount))}</p>
          )}
        </div>
        {hasNext ? (
          <button
            type="button"
            onClick={onNext}
            aria-label={dict.mealPlan.nextPlan}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="h-8 w-8 shrink-0" />
        )}
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
          onClick={() => setPickerOpen(true)}
          disabled={cardRecipes.length === 0}
          className="flex-1 rounded-xl bg-white py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
        >
          {dict.mealPlan.shareCardButton}
        </button>
      </div>

      <ShareDesignPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        shareTitle={title}
        cardData={{
          title,
          eventDateLabel: eventDate ? formatEventDateTime(eventDate, locale) : null,
          headcountLabel: headcount ? `${headcount}${dict.mealPlan.headcountSuffix}` : null,
          recipes: cardRecipes,
        }}
      />
    </GlassCard>
  );
}
