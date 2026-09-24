"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useDict, useLocale } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/locales";
import type { MealPlanListItem } from "./meal-plan-list-data";

const LOCALE_TAGS: Record<Locale, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP" };

function formatShortDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: "long", day: "numeric" }).format(new Date(iso));
}

export function MealPlanList({ plans }: { plans: MealPlanListItem[] }) {
  const dict = useDict();
  const locale = useLocale();

  if (plans.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-surface px-5 pb-8">
        <EmptyState mascot="idea">{dict.mealPlan.emptyState}</EmptyState>
        <div className="mt-6 flex justify-center">
          <Link href="/explore/new" className="flex min-h-12 items-center rounded-2xl bg-accent px-5 text-sm font-bold text-white">{dict.components.newMealPlanLink}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan) => {
        const metaParts = [
          plan.eventDate ? formatShortDate(plan.eventDate, locale) : null,
          dict.mealPlan.recipeCountTemplate.replace("{count}", String(plan.recipeCount)),
        ].filter((part): part is string => !!part);

        return (
          <Link key={plan.id} href={`/explore/${plan.id}`}>
            <GlassCard className="flex items-center gap-4 bg-white p-4">
              <ProfileAvatar iconEmoji={plan.iconEmoji} nickname={plan.title} size={52} kind="mealPlan" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-base font-bold leading-snug text-ink">{plan.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{metaParts.join(" · ")}</p>
              </div>
              <svg aria-hidden="true" className="shrink-0 text-ink-soft" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
}
