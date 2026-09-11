"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui";
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
    return <p className="mt-10 text-center text-sm text-ink-faint">{dict.mealPlan.emptyState}</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {plans.map((plan) => {
        const metaParts = [
          plan.eventDate ? formatShortDate(plan.eventDate, locale) : null,
          dict.mealPlan.recipeCountTemplate.replace("{count}", String(plan.recipeCount)),
        ].filter((part): part is string => !!part);

        return (
          <Link key={plan.id} href={`/explore/${plan.id}`}>
            <GlassCard className="flex items-center gap-3 bg-white p-3">
              <ProfileAvatar iconEmoji={plan.iconEmoji} nickname={plan.title} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{plan.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{metaParts.join(" · ")}</p>
              </div>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
}
