"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { updateMealPlanDetails } from "@/lib/actions/meal-plans";
import { renderMealPlanCard, type MealPlanCardRecipe } from "./meal-plan-card-image";
import { useDict } from "@/lib/i18n/client";

export function MealPlanInfoBox({
  mealPlanId,
  title,
  eventDate,
  headcount,
  cardRecipes,
}: {
  mealPlanId: string;
  title: string;
  eventDate: string | null;
  headcount: number | null;
  cardRecipes: MealPlanCardRecipe[];
}) {
  const dict = useDict();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  function saveDate(value: string) {
    startTransition(async () => {
      await updateMealPlanDetails(mealPlanId, { eventDate: value || null });
      router.refresh();
    });
  }

  function saveHeadcount(value: string) {
    const n = value.trim() ? Number(value) : null;
    startTransition(async () => {
      await updateMealPlanDetails(mealPlanId, { headcount: n });
      router.refresh();
    });
  }

  async function generate() {
    setGenerating(true);
    const result = await renderMealPlanCard({
      title,
      eventDateLabel: eventDate ? eventDate.replace(/-/g, ".") : null,
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
    <GlassCard className="mb-4 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          {dict.mealPlan.eventDateLabel}
          <input
            type="date"
            defaultValue={eventDate ?? ""}
            onChange={(e) => saveDate(e.target.value)}
            className="rounded-lg bg-surface px-2.5 py-1.5 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          {dict.mealPlan.headcountLabel}
          <input
            type="number"
            min={1}
            defaultValue={headcount ?? ""}
            onChange={(e) => saveHeadcount(e.target.value)}
            placeholder="-"
            className="w-20 rounded-lg bg-surface px-2.5 py-1.5 text-sm text-ink outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={generating || cardRecipes.length === 0}
        className="mt-3 w-full rounded-xl border border-accent bg-white py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
      >
        {generating ? dict.mealPlan.creatingEllipsis : dict.mealPlan.generateCardButton}
      </button>

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
