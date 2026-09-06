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
// Fixed A4 portrait ratio (1 : √2), sized well below actual A4 print
// resolution — this is for sharing on a phone screen, not printing.

import localFont from "next/font/local";
import { Noto_Serif_KR, Gaegu, Black_Han_Sans } from "next/font/google";

const suit = localFont({ src: "../../../../fonts/SUIT-Variable.woff2", weight: "100 900" });
const notoSerifKr = Noto_Serif_KR({ subsets: ["latin"], weight: ["500", "700"] });
const gaegu = Gaegu({ subsets: ["latin"], weight: ["700"] });
const blackHanSans = Black_Han_Sans({ subsets: ["latin"], weight: "400" });

export type MealPlanCardRecipe = { title: string; ingredientNames: string[] };
export type MealPlanCardData = {
  householdName: string;
  title: string;
  recipes: MealPlanCardRecipe[];
};

const WIDTH = 1000;
const HEIGHT = Math.round(WIDTH * Math.SQRT2); // ~1414, A4's ratio
const PADDING = 90;
const INK = "#1c1c1c";
const INK_SOFT = "#6b6b6b";

// Base sizes at scale 1 — shrunk together (see fit-to-height below) when a
// plan has enough recipes that they wouldn't fit the fixed canvas height
// otherwise.
const BASE_NAME_SIZE = 40;
const BASE_INGREDIENTS_SIZE = 26;
const BASE_NAME_GAP = 44;
const BASE_BLOCK_GAP = 70;
const HOUSEHOLD_NAME_Y = 200;
const TITLE_Y = 250;
const RECIPES_START_Y = 420;
const FOOTER_HEIGHT = 100;

type RecipeLayout = { text: string; blockHeight: number };

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

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const centerX = WIDTH / 2;

  // Household name + meal plan title, both centered
  ctx.fillStyle = INK;
  ctx.font = `700 30px ${font}`;
  ctx.fillText(data.householdName, centerX, HOUSEHOLD_NAME_Y);
  ctx.font = `800 54px ${font}`;
  ctx.fillText(data.title, centerX, TITLE_Y + 60);

  // Recipes
  let y = RECIPES_START_Y;
  data.recipes.forEach((recipe, i) => {
    const { text, blockHeight } = layouts[i];
    ctx.fillStyle = INK;
    ctx.font = `700 ${BASE_NAME_SIZE * scale}px ${font}`;
    ctx.fillText(recipe.title, centerX, y);
    ctx.fillStyle = INK_SOFT;
    ctx.font = `400 ${BASE_INGREDIENTS_SIZE * scale}px ${font}`;
    ctx.fillText(text, centerX, y + BASE_NAME_GAP * scale);
    y += blockHeight;
  });

  // Footer wordmark, pinned near the bottom regardless of content length
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 26px ${font}`;
  ctx.fillText("우리집 레시피", centerX, HEIGHT - FOOTER_HEIGHT / 2);

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
    id: "serif",
    label: "명조",
    className: notoSerifKr.className,
    render: (data) => renderTemplate(data, `${notoSerifKr.style.fontFamily}, serif`),
  },
  {
    id: "handwriting",
    label: "손글씨",
    className: gaegu.className,
    render: (data) => renderTemplate(data, `${gaegu.style.fontFamily}, ${FALLBACK}`),
  },
  {
    id: "impact",
    label: "임팩트",
    className: blackHanSans.className,
    render: (data) => renderTemplate(data, `${blackHanSans.style.fontFamily}, ${FALLBACK}`),
  },
];
