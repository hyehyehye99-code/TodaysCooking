// Turns the recipe form's FormData into a GuestRecipeInput — the client-side
// counterpart of createRecipe()/updateRecipe() in lib/actions/recipes.ts.

import { parseIngredients } from "@/lib/ingredientParsing";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { MAX_RECIPE_PHOTOS } from "@/lib/constants";
import type { GuestRecipeInput, GuestReference } from "@/lib/guest/store";

// PhotoPicker already shrinks photos to 1080px for upload, but localStorage
// holds ~5MB in total and stores them as base64 — so guest photos get
// squeezed a second time to keep a handful of recipes well under that.
const GUEST_PHOTO_MAX_DIMENSION = 720;
const GUEST_PHOTO_QUALITY = 0.72;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToDataUrl(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, GUEST_PHOTO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", GUEST_PHOTO_QUALITY);
  } catch {
    try {
      return await readAsDataUrl(file);
    } catch {
      return null;
    }
  }
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function buildGuestRecipeInput(
  formData: FormData,
  existingReference: GuestReference | null = null
): Promise<{ input: GuestRecipeInput } | { error: string }> {
  // PhotoPicker submits an ordered token list ("existing:<url>" or "new:<i>",
  // <i> indexing into the "photos" file input) so kept and newly-added photos
  // can interleave — see resolvePhotoUrls() in lib/actions/recipes.ts.
  let order: string[] = [];
  try {
    order = JSON.parse(String(formData.get("photoOrder") ?? "[]"));
  } catch {
    order = [];
  }
  order = order.slice(0, MAX_RECIPE_PHOTOS);

  const newFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const converted = await Promise.all(newFiles.map(fileToDataUrl));
  if (converted.some((url) => url === null)) return { error: "사진을 저장하지 못했어요." };

  const photoUrls = order
    .map((token) => {
      if (token.startsWith("new:")) return converted[Number(token.slice(4))] ?? null;
      if (token.startsWith("existing:")) return token.slice("existing:".length);
      return null;
    })
    .filter((url): url is string => !!url);

  const referenceUrl = String(formData.get("referenceUrl") ?? "").trim();
  let reference: GuestReference | null = null;
  if (referenceUrl) {
    if (existingReference && existingReference.url === referenceUrl) {
      reference = existingReference;
    } else {
      const preview = await fetchLinkPreview(referenceUrl);
      if (preview.ok) {
        reference = {
          url: preview.url,
          title: preview.title,
          domain: preview.domain,
          thumbnail_url: preview.thumbnailUrl,
        };
      }
    }
  }

  return {
    input: {
      title: String(formData.get("title") ?? "").trim() || null,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      icon_emoji: String(formData.get("iconEmoji") ?? "").trim() || null,
      tags: parseTags(String(formData.get("tags") ?? "")),
      notes: String(formData.get("notes") ?? "").trim() || null,
      hide_ingredients: formData.get("hideIngredients") === "on",
      cover_photo_urls: photoUrls,
      ingredients: parseIngredients(String(formData.get("ingredients") ?? "")).map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        skipped: false,
      })),
      reference,
    },
  };
}
