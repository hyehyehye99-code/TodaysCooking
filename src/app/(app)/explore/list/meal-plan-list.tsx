"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { setMealPlanHidden, deleteMealPlan } from "@/lib/actions/meal-plans";
import { useDict, useLocale } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/locales";
import type { MealPlanListItem } from "./meal-plan-list-data";

const LOCALE_TAGS: Record<Locale, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP" };

function formatShortDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: "long", day: "numeric" }).format(new Date(iso));
}

function VisibilityToggleButton({
  hidden,
  disabled,
  label,
  onClick,
}: {
  hidden: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint disabled:opacity-60"
    >
      {hidden ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 12S6 6.5 12 6.5c1.4 0 2.7.3 3.9.8" />
          <path d="M20 9.5c1.2 1 1.5 2.2 1.5 2.5s-3.5 5.5-9.5 5.5c-1 0-1.9-.15-2.7-.4" />
          <path d="M9.6 9.6a3 3 0 0 0 4.2 4.2" />
          <path d="M2.5 2.5l19 19" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function DeleteButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-warn-ink disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16" />
        <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
        <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </button>
  );
}

export function MealPlanList({
  plans,
  showCloseButton = true,
}: {
  plans: MealPlanListItem[];
  showCloseButton?: boolean;
}) {
  const dict = useDict();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function toggleHidden(plan: MealPlanListItem) {
    startTransition(async () => {
      await setMealPlanHidden(plan.id, !plan.hidden);
      router.refresh();
    });
  }

  function doDelete() {
    if (!confirmingId) return;
    const id = confirmingId;
    startDeleteTransition(async () => {
      await deleteMealPlan(id);
    });
  }

  return (
    <div>
      {showCloseButton && (
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[22px] font-bold">{dict.mealPlan.listSheetTitle}</h1>
          <button
            type="button"
            onClick={() => router.push("/explore")}
            aria-label={dict.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-faint">{dict.mealPlan.emptyState}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {plans.map((plan) => {
            const metaParts = [
              plan.eventDate ? formatShortDate(plan.eventDate, locale) : null,
              dict.mealPlan.recipeCountTemplate.replace("{count}", String(plan.recipeCount)),
            ].filter((part): part is string => !!part);

            return (
              <GlassCard
                key={plan.id}
                className={`flex items-center gap-3 bg-white p-3 ${plan.hidden ? "opacity-60" : ""}`}
              >
                <ProfileAvatar iconEmoji={plan.iconEmoji} nickname={plan.title} size={52} />
                {plan.hidden ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink-faint">{plan.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">{metaParts.join(" · ")}</p>
                  </div>
                ) : (
                  <Link href={`/explore/${plan.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink">{plan.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">{metaParts.join(" · ")}</p>
                  </Link>
                )}
                <div className="flex shrink-0 items-center gap-0.5">
                  <VisibilityToggleButton
                    hidden={plan.hidden}
                    disabled={pending}
                    label={plan.hidden ? dict.mealPlan.unhideAction : dict.mealPlan.hideAction}
                    onClick={() => toggleHidden(plan)}
                  />
                  <DeleteButton
                    disabled={deletePending}
                    label={dict.mealPlan.deleteMealPlanButton}
                    onClick={() => setConfirmingId(plan.id)}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!confirmingId}
        onClose={() => setConfirmingId(null)}
        title={dict.mealPlan.deleteTitle}
        description={dict.mealPlan.deleteDescription}
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={deletePending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {deletePending ? dict.recipes.deleting : dict.common.delete}
          </button>
        }
      />
    </div>
  );
}
