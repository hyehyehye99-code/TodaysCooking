"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { setMealPlanHidden, deleteMealPlan } from "@/lib/actions/meal-plans";
import { useDict } from "@/lib/i18n/client";

type Plan = { id: string; title: string; hidden: boolean };

export function MealPlanList({ plans }: { plans: Plan[] }) {
  const dict = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function toggleHidden(plan: Plan) {
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
              <button
                type="button"
                onClick={() => setConfirmingId(plan.id)}
                className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-warn-ink"
              >
                {dict.mealPlan.deleteMealPlanButton}
              </button>
            </GlassCard>
          ))}
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
