"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { MEAL_PLAN_CARD_TEMPLATES, type MealPlanCardData } from "./meal-plan-card-image";
import { useDict } from "@/lib/i18n/client";

type Preview = { id: string; url: string; blob: Blob };

// Editable copy of what actually renders onto the card — kept local to this
// picker (not saved back to the meal plan/recipes) so wording can be
// curated for the shared image without touching the real data.
function EditCardContent({
  data,
  onCancel,
  onSave,
}: {
  data: MealPlanCardData;
  onCancel: () => void;
  onSave: (next: MealPlanCardData) => void;
}) {
  const dict = useDict();
  const [householdName, setHouseholdName] = useState(data.householdName);
  const [title, setTitle] = useState(data.title);
  const [recipes, setRecipes] = useState(
    data.recipes.map((r) => ({ title: r.title, ingredientsText: r.ingredientNames.join(", ") }))
  );

  function save() {
    onSave({
      householdName: householdName.trim() || data.householdName,
      title: title.trim() || data.title,
      recipes: recipes.map((r) => ({
        title: r.title.trim(),
        ingredientNames: r.ingredientsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })),
    });
  }

  return (
    <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
        {dict.mealPlan.cardHouseholdNameLabel}
        <input
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          className="rounded-lg bg-surface px-3 py-2 text-sm text-ink outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
        {dict.mealPlan.titleLabel}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg bg-surface px-3 py-2 text-sm text-ink outline-none"
        />
      </label>
      {recipes.map((r, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-xl bg-surface p-3">
          <input
            value={r.title}
            onChange={(e) =>
              setRecipes((prev) => prev.map((p, pi) => (pi === i ? { ...p, title: e.target.value } : p)))
            }
            className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-ink outline-none"
          />
          <input
            value={r.ingredientsText}
            onChange={(e) =>
              setRecipes((prev) => prev.map((p, pi) => (pi === i ? { ...p, ingredientsText: e.target.value } : p)))
            }
            placeholder={dict.mealPlan.cardIngredientsPlaceholder}
            className="rounded-lg bg-white px-3 py-2 text-xs text-ink-soft outline-none"
          />
        </div>
      ))}
      <div className="mt-1 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft">
          {dict.common.cancel}
        </button>
        <button type="button" onClick={save} className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white">
          {dict.common.confirm}
        </button>
      </div>
    </div>
  );
}

export function ShareDesignPicker({
  open,
  onClose,
  cardData,
  shareTitle,
}: {
  open: boolean;
  onClose: () => void;
  cardData: MealPlanCardData;
  shareTitle: string;
}) {
  const dict = useDict();
  const [data, setData] = useState(cardData);
  const [editing, setEditing] = useState(false);
  const [previews, setPreviews] = useState<Preview[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sharing, setSharing] = useState(false);

  // Discards any card-only edits so the next open starts fresh from the
  // real data — tied to the close action itself rather than an effect.
  function handleClose() {
    setData(cardData);
    setEditing(false);
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      const results = await Promise.all(
        MEAL_PLAN_CARD_TEMPLATES.map(async (t) => {
          const blob = await t.render(data);
          if (!blob) return null;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          return { id: t.id, url, blob };
        })
      );
      if (!cancelled) setPreviews(results.filter((r): r is Preview => r !== null));
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [open, data]);

  function saveImage() {
    const preview = previews?.[selectedIndex];
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview.url;
    a.download = "meal-plan.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function share() {
    const preview = previews?.[selectedIndex];
    if (!preview) return;
    setSharing(true);
    const file = new File([preview.blob], "meal-plan.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
      } else {
        // No file-sharing support (rare) — open it full-size so it can at
        // least be long-pressed and saved.
        window.open(preview.url, "_blank");
      }
    } catch {
      // Includes the user dismissing the share sheet — nothing to show.
    }
    setSharing(false);
  }

  return (
    <Modal open={open} onClose={handleClose} variant="sheet">
      <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        {editing ? (
          <>
            <p className="mb-3 text-[15px] font-bold">{dict.mealPlan.editCardContentTitle}</p>
            <EditCardContent
              data={data}
              onCancel={() => setEditing(false)}
              onSave={(next) => {
                setData(next);
                setEditing(false);
              }}
            />
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[15px] font-bold">{dict.mealPlan.chooseFontTitle}</p>
              <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-accent-ink">
                {dict.mealPlan.editCardContentButton}
              </button>
            </div>

            {!previews ? (
              <p className="py-10 text-center text-xs text-ink-faint">{dict.mealPlan.creatingEllipsis}</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {MEAL_PLAN_CARD_TEMPLATES.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedIndex(i)}
                      className={`rounded-full border px-3.5 py-2 text-sm ${t.className} ${
                        i === selectedIndex ? "border-accent bg-accent/8 text-accent-ink" : "border-border text-ink-soft"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {previews[selectedIndex] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[selectedIndex].url}
                    alt=""
                    className="max-h-[50vh] w-full rounded-xl border border-border object-contain"
                  />
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={saveImage}
                    className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
                  >
                    {dict.mealPlan.saveImageButton}
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
              </>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
            >
              {dict.common.close}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
