"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { setMealPlanHidden } from "@/lib/actions/meal-plans";
import { useDict } from "@/lib/i18n/client";

type Plan = { id: string; title: string; hidden: boolean };

export function MealPlanList({ plans }: { plans: Plan[] }) {
  const dict = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleHidden(plan: Plan) {
    startTransition(async () => {
      await setMealPlanHidden(plan.id, !plan.hidden);
      router.refresh();
    });
  }

  return (
    <div>
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

      {plans.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-faint">{dict.mealPlan.emptyState}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {plans.map((plan) => (
            <GlassCard key={plan.id} className="flex items-center gap-2 bg-white p-3">
              {plan.hidden ? (
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-faint">{plan.title}</span>
              ) : (
                <Link href={`/explore/${plan.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {plan.title}
                </Link>
              )}
              <button
                type="button"
                onClick={() => toggleHidden(plan)}
                disabled={pending}
                className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-60"
              >
                {plan.hidden ? dict.mealPlan.unhideAction : dict.mealPlan.hideAction}
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
