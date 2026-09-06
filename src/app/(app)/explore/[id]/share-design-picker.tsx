"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { MEAL_PLAN_CARD_TEMPLATES, type MealPlanCardData } from "./meal-plan-card-image";
import { useDict } from "@/lib/i18n/client";

type Preview = { id: string; url: string; blob: Blob };

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
  const [previews, setPreviews] = useState<Preview[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Map<number, HTMLElement>>(new Map());
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      const results = await Promise.all(
        MEAL_PLAN_CARD_TEMPLATES.map(async (t) => {
          const blob = await t.render(cardData);
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
      setPreviews(null);
      setSelectedIndex(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleScroll() {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let closest = 0;
      let closestDist = Infinity;
      for (const [i, el] of panelRefs.current) {
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      setSelectedIndex(closest);
    }, 100);
  }

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
    <Modal open={open} onClose={onClose} variant="sheet">
      <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        <p className="mb-3 text-[15px] font-bold">{dict.mealPlan.chooseDesignTitle}</p>

        {!previews ? (
          <p className="py-10 text-center text-xs text-ink-faint">{dict.mealPlan.creatingEllipsis}</p>
        ) : (
          <>
            <div ref={scrollerRef} onScroll={handleScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto">
              {previews.map((p, i) => (
                <div
                  key={p.id}
                  ref={(el) => {
                    if (el) panelRefs.current.set(i, el);
                    else panelRefs.current.delete(i);
                  }}
                  className="w-full shrink-0 snap-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="max-h-[50vh] w-full rounded-xl border border-border object-contain"
                  />
                </div>
              ))}
            </div>

            {previews.length > 1 && (
              <div className="mt-2 flex justify-center gap-1.5">
                {previews.map((p, i) => (
                  <span
                    key={p.id}
                    className={`h-1.5 rounded-full transition-all ${
                      i === selectedIndex ? "w-4 bg-accent" : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>
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
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
        >
          {dict.common.close}
        </button>
      </div>
    </Modal>
  );
}
