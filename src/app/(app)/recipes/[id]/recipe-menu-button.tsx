"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteRecipe } from "@/lib/actions/recipes";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDict } from "@/lib/i18n/client";

export function RecipeMenuButton({ recipeId }: { recipeId: string }) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function doDelete() {
    startTransition(async () => {
      const form = new FormData();
      form.set("id", recipeId);
      await deleteRecipe(form);
    });
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={dict.recipes.moreOptions}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

        <div
          className={`absolute right-0 top-full z-20 mt-2 w-36 origin-top-right overflow-hidden rounded-2xl border border-border bg-white shadow-lg transition-all duration-200 ${
            open
              ? "max-h-40 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-0.5 p-1.5">
            <Link
              href={`/recipes/${recipeId}/edit`}
              onClick={() => setOpen(false)}
              className="w-full whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink"
            >
              {dict.recipes.editButton}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
              className="w-full whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-warn-ink"
            >
              {dict.recipes.deleteMenu}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={dict.recipes.deleteRecipeTitle}
        description={dict.recipes.deleteRecipeDescription}
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? dict.recipes.deleting : dict.common.delete}
          </button>
        }
      />
    </>
  );
}
