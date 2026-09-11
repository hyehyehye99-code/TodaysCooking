"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { ProfileAvatar } from "@/components/ProfileAvatar";
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
  householdName,
  title,
  iconEmoji,
  eventDate,
  headcount,
  cardRecipes,
  recipeCount,
}: {
  mealPlanId: string;
  householdName: string;
  title: string;
  iconEmoji: string | null;
  eventDate: string | null;
  headcount: number | null;
  cardRecipes: MealPlanCardRecipe[];
  recipeCount: number;
}) {
  const dict = useDict();
  const locale = useLocale();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <GlassCard className="mb-4 bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProfileAvatar iconEmoji={iconEmoji} nickname={title} size={44} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            <p className="text-xs text-ink-soft">
              {dict.mealPlan.recipeCountTemplate.replace("{count}", String(recipeCount))}
            </p>
          </div>
        </div>
        <Link
          href="/explore"
          aria-label={dict.common.close}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      {(eventDate || headcount != null) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eventDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
                <path d="M8 2.5v4" />
                <path d="M16 2.5v4" />
                <path d="M3.5 9.5h17" />
              </svg>
              {formatEventDateTime(eventDate, locale)}
            </span>
          )}
          {headcount != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
              </svg>
              {dict.mealPlan.headcountLineTemplate.replace("{count}", String(headcount))}
            </span>
          )}
        </div>
      )}

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
          householdName,
          title,
          recipes: cardRecipes,
        }}
      />
    </GlassCard>
  );
}
