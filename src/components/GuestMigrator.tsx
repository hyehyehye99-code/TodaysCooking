"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { importGuestLists, importGuestRecipe } from "@/lib/actions/guest-import";
import { clearGuestData, deleteRecipes, getGuestData, hasGuestData, sortRecipes } from "@/lib/guest/store";
import { SavedToast } from "@/components/SavedToast";
import { useDict } from "@/lib/i18n/client";

// Guards against React strict-mode's double effect (and a fast remount)
// starting two migrations at once — the recipe-by-recipe cleanup below is
// what makes one safe, but two racing would import the same recipe twice.
let migrating = false;

async function dataUrlToFile(dataUrl: string, index: number): Promise<File | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], `photo-${index}.jpg`, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

// Mounted only for signed-in users. When this device still holds guest data
// (recipes / shopping / fridge saved before logging in), moves it into the
// account's household and clears it locally. Recipes go one at a time and are
// removed from the device only after the server confirms each — so if
// anything fails midway, the rest stays put and the next visit resumes.
export function GuestMigrator() {
  const dict = useDict();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [doneTrigger, setDoneTrigger] = useState(0);
  const [movedCount, setMovedCount] = useState(0);

  useEffect(() => {
    if (migrating || !hasGuestData()) return;
    migrating = true;

    (async () => {
      setRunning(true);
      let moved = 0;
      let failed = false;

      // Oldest-first import: each one lands at the top of the list, so the
      // account ends up in the same order the device showed.
      const recipes = sortRecipes(getGuestData().recipes).reverse();
      for (const recipe of recipes) {
        const form = new FormData();
        form.set(
          "data",
          JSON.stringify({
            title: recipe.title,
            subtitle: recipe.subtitle,
            icon_emoji: recipe.icon_emoji,
            tags: recipe.tags,
            notes: recipe.notes,
            hide_ingredients: recipe.hide_ingredients,
            is_favorite: recipe.is_favorite,
            ingredients: recipe.ingredients,
            reference: recipe.reference,
          })
        );
        const photos = await Promise.all(recipe.cover_photo_urls.map(dataUrlToFile));
        photos.forEach((file) => file && form.append("photos", file));

        try {
          const result = await importGuestRecipe(form);
          if ("error" in result) throw new Error(result.error);
        } catch {
          failed = true;
          break;
        }
        deleteRecipes([recipe.id]);
        moved += 1;
      }

      if (!failed) {
        const { shopping, fridge } = getGuestData();
        try {
          if (shopping.length > 0 || fridge.length > 0) {
            const result = await importGuestLists({ shopping, fridge });
            if ("error" in result) throw new Error(result.error);
          }
          clearGuestData();
        } catch {
          failed = true;
        }
      }

      setRunning(false);
      migrating = false;
      if (moved > 0) {
        setMovedCount(moved);
        setDoneTrigger((t) => t + 1);
      }
      if (moved > 0 || !failed) router.refresh();
    })();
  }, [router]);

  return (
    <>
      {running && (
        <div
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ top: "max(env(safe-area-inset-top), 16px)" }}
        >
          <div className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-lg">
            {dict.guest.migrating}
          </div>
        </div>
      )}
      <SavedToast message={dict.guest.migratedTemplate.replace("{count}", String(movedCount))} trigger={doneTrigger} />
    </>
  );
}
