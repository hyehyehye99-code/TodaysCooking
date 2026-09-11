// Renders a shareable "메뉴판" card as a PNG — plain Canvas 2D drawing, no
// recipe/link photos involved on purpose: those are frequently hotlinked
// from YouTube/Instagram CDNs without CORS headers, which would taint the
// canvas and block toBlob() entirely. Text + emoji only keeps export
// reliable everywhere.
//
// One layout, several font choices — this is a font picker, not a design
// picker. Each font is loaded via next/font (self-hosted, no runtime CDN
// call) so it's registered in document.fonts by the time the picker's
// preview buttons render it — same mechanism that makes it usable here on
// <canvas>, which can only draw a font that's actually loaded.
//
// A tall portrait ratio (taller than A4's 1:√2), sized well below actual
// print resolution — this is for sharing on a phone screen, not printing.

import localFont from "next/font/local";

const suit = localFont({ src: "../../../../fonts/SUIT-Variable.woff2", weight: "100 900" });
const noltotaenggu = localFont({ src: "../../../../fonts/griun-noltotaenggu.ttf" });
const bombaram = localFont({ src: "../../../../fonts/hs-bombaram.ttf" });
const hwalkongserif = localFont({ src: "../../../../fonts/hs-hwalkongserif.ttf" });
const santokki = localFont({ src: "../../../../fonts/hs-santokki.ttf" });
const memoment = localFont({ src: "../../../../fonts/memoment-kkukkukk.ttf" });
const chosunGs = localFont({ src: "../../../../fonts/chosun-gs.ttf" });
const chosunSm = localFont({ src: "../../../../fonts/chosun-sm.ttf" });
const gowunBatang = localFont({ src: "../../../../fonts/gowun-batang.ttf" });

export type MealPlanCardRecipe = { title: string; ingredientNames: string[] };
export type MealPlanCardData = {
  householdName: string;
  title: string;
  recipes: MealPlanCardRecipe[];
};

const WIDTH = 1000;
const HEIGHT = Math.round(WIDTH * 1.85); // taller than A4's ~1.414 ratio
const PADDING = 90;
const INK = "#1c1c1c";
const INK_SOFT = "#6b6b6b";

// Base sizes at scale 1 — shrunk together (see fit-to-height below) when a
// plan has enough recipes that they wouldn't fit the fixed canvas height
// otherwise.
const BASE_NAME_SIZE = 34;
const BASE_INGREDIENTS_SIZE = 22;
const BASE_NAME_GAP = 40;
const BASE_BLOCK_GAP = 85;
const HOUSEHOLD_NAME_Y = 200;
const TITLE_Y = 200;
const RECIPES_START_Y = 410;
const FOOTER_HEIGHT = 100;

type RecipeLayout = { text: string; blockHeight: number };

// Same-origin (served from /public), so drawing it onto the canvas doesn't
// taint it the way a hotlinked cross-origin image would — cached across
// renders since every template draws the same mark.
let logoImagePromise: Promise<HTMLImageElement> | null = null;
function loadLogoImage(): Promise<HTMLImageElement> {
  if (!logoImagePromise) {
    logoImagePromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = "/logo-mark.svg";
    });
  }
  return logoImagePromise;
}

function layoutRecipe(recipe: MealPlanCardRecipe, scale: number): RecipeLayout {
  const text = recipe.ingredientNames.length > 0 ? recipe.ingredientNames.join(", ") : "-";
  const blockHeight = BASE_NAME_GAP * scale + BASE_INGREDIENTS_SIZE * scale + BASE_BLOCK_GAP * scale;
  return { text, blockHeight };
}

async function renderTemplate(data: MealPlanCardData, font: string): Promise<Blob | null> {
  const availableForRecipes = HEIGHT - RECIPES_START_Y - FOOTER_HEIGHT - PADDING;

  const naturalHeight = data.recipes.reduce((sum, r) => sum + layoutRecipe(r, 1).blockHeight, 0);
  // Only ever shrink to fit — a short plan keeps its designed size and
  // leaves whitespace rather than being stretched to fill it.
  const scale = naturalHeight > availableForRecipes ? Math.max(0.45, availableForRecipes / naturalHeight) : 1;
  const layouts = data.recipes.map((r) => layoutRecipe(r, scale));

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // A couple of the picker's local fonts are large (multi-MB) TTFs — every
  // template's canvas draws in parallel as soon as the picker opens (see
  // ShareDesignPicker), so without this a large font can still be mid-
  // download when its fillText runs and silently falls back to the system
  // font instead of waiting for it.
  try {
    await document.fonts.load(`16px ${font}`);
  } catch {
    // Load failure just means the fallback already in `font` draws instead.
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const centerX = WIDTH / 2;

  // Household name + meal plan title, both centered
  ctx.fillStyle = INK;
  ctx.font = `400 26px ${font}`;
  ctx.fillText(data.householdName, centerX, HOUSEHOLD_NAME_Y);
  ctx.font = `700 46px ${font}`;
  ctx.fillText(data.title, centerX, TITLE_Y + 60);

  // Recipes
  let y = RECIPES_START_Y;
  data.recipes.forEach((recipe, i) => {
    const { text, blockHeight } = layouts[i];
    ctx.fillStyle = INK;
    ctx.font = `500 ${BASE_NAME_SIZE * scale}px ${font}`;
    ctx.fillText(recipe.title, centerX, y);
    ctx.fillStyle = INK_SOFT;
    ctx.font = `400 ${BASE_INGREDIENTS_SIZE * scale}px ${font}`;
    ctx.fillText(text, centerX, y + BASE_NAME_GAP * scale);
    y += blockHeight;
  });

  // Footer mark, pinned near the bottom regardless of content length
  const logo = await loadLogoImage();
  const logoSize = 44;
  ctx.drawImage(logo, centerX - logoSize / 2, HEIGHT - FOOTER_HEIGHT / 2 - logoSize / 2, logoSize, logoSize);

  ctx.textAlign = "left";

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export type MealPlanCardTemplate = {
  id: string;
  label: string;
  // className is applied to the picker's own preview button so the label
  // itself previews in that font — purely cosmetic, doesn't affect canvas.
  className: string;
  render: (data: MealPlanCardData) => Promise<Blob | null>;
};

const FALLBACK = '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

export const MEAL_PLAN_CARD_TEMPLATES: MealPlanCardTemplate[] = [
  {
    id: "sans",
    label: "기본",
    className: suit.className,
    render: (data) => renderTemplate(data, `${suit.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "noltotaenggu",
    label: "노을탱구",
    className: noltotaenggu.className,
    render: (data) => renderTemplate(data, `${noltotaenggu.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "bombaram",
    label: "봄바람",
    className: bombaram.className,
    render: (data) => renderTemplate(data, `${bombaram.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "hwalkongserif",
    label: "활공세리프",
    className: hwalkongserif.className,
    render: (data) => renderTemplate(data, `${hwalkongserif.style.fontFamily}, serif`),
  },
  {
    id: "santokki",
    label: "산토끼",
    className: santokki.className,
    render: (data) => renderTemplate(data, `${santokki.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "memoment",
    label: "꾸끄꾹",
    className: memoment.className,
    render: (data) => renderTemplate(data, `${memoment.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "chosun-gs",
    label: "조선굵은",
    className: chosunGs.className,
    render: (data) => renderTemplate(data, `${chosunGs.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "chosun-sm",
    label: "조선얇은",
    className: chosunSm.className,
    render: (data) => renderTemplate(data, `${chosunSm.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "gowun-batang",
    label: "고운바탕",
    className: gowunBatang.className,
    render: (data) => renderTemplate(data, `${gowunBatang.style.fontFamily}, serif`),
  },
];
