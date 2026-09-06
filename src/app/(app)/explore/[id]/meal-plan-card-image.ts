// Renders a shareable "메뉴판" card as a PNG — plain Canvas 2D drawing, no
// recipe/link photos involved on purpose: those are frequently hotlinked
// from YouTube/Instagram CDNs without CORS headers, which would taint the
// canvas and block toBlob() entirely. Text + emoji only keeps export
// reliable everywhere.
//
// One layout, two font choices ("기본"/default sans vs "명조"/serif) — not
// separate layouts, per direction. AppleMyungjo is a system serif on
// iOS/macOS (this app's actual runtime), so the serif variant doesn't need
// a web font loaded.
//
// Fixed A4 portrait ratio (1 : √2), sized well below actual A4 print
// resolution — this is for sharing on a phone screen, not printing.

export type MealPlanCardRecipe = { title: string; ingredientNames: string[] };
export type MealPlanCardData = {
  title: string;
  eventDateLabel: string | null;
  headcountLabel: string | null;
  recipes: MealPlanCardRecipe[];
};

const WIDTH = 1000;
const HEIGHT = Math.round(WIDTH * Math.SQRT2); // ~1414, A4's ratio
const PADDING = 80;
const RIGHT_RAIL = 120;
const CREAM = "#f4f0e8";
const TERRACOTTA = "#b5603c";
const INK_DARK = "#3d3d3d";
const LINE = "#d8cfc0";

const SANS_FONT = '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const SERIF_FONT = '"AppleMyungjo", "Nanum Myeongjo", "Batang", serif';

// Base sizes at scale 1 — shrunk together (see fit-to-height below) when a
// plan has enough recipes/ingredients that they wouldn't fit the fixed
// canvas height otherwise.
const BASE_TITLE_SIZE = 34;
const BASE_LINE_SIZE = 34;
const BASE_LINE_HEIGHT = 56;
const BASE_TITLE_GAP = 52;
const BASE_BLOCK_GAP = 36;
const HEADER_HEIGHT = 140;

type RecipeLayout = { lines: string[]; blockHeight: number };

function layoutRecipe(recipe: MealPlanCardRecipe, scale: number): RecipeLayout {
  const lines = recipe.ingredientNames.length > 0 ? recipe.ingredientNames : ["-"];
  const blockHeight = BASE_TITLE_GAP * scale + lines.length * BASE_LINE_HEIGHT * scale + BASE_BLOCK_GAP * scale;
  return { lines, blockHeight };
}

async function renderTemplate(data: MealPlanCardData, font: string): Promise<Blob | null> {
  const footerHeight = data.eventDateLabel || data.headcountLabel ? 90 : 40;
  const availableForRecipes = HEIGHT - HEADER_HEIGHT - footerHeight - PADDING;

  const naturalHeight = data.recipes.reduce((sum, r) => sum + layoutRecipe(r, 1).blockHeight, 0);
  // Only ever shrink to fit — a short plan keeps its designed size and
  // leaves whitespace at the bottom rather than being stretched to fill it.
  const scale = naturalHeight > availableForRecipes ? Math.max(0.45, availableForRecipes / naturalHeight) : 1;
  const layouts = data.recipes.map((r) => layoutRecipe(r, scale));

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const contentRight = WIDTH - RIGHT_RAIL;
  const contentLeft = PADDING + 30;

  // Small wordmark, top-left
  ctx.fillStyle = INK_DARK;
  ctx.font = `italic 600 28px ${font}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("우리집 레시피", PADDING, 70);

  // Vertical accent line + a dot at its top, running the height of the
  // recipe list
  const lineTop = HEADER_HEIGHT + 10;
  const lineBottom = HEIGHT - footerHeight - 10;
  ctx.strokeStyle = TERRACOTTA;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING, lineTop);
  ctx.lineTo(PADDING, lineBottom);
  ctx.stroke();
  ctx.fillStyle = TERRACOTTA;
  ctx.beginPath();
  ctx.arc(PADDING, lineTop, 5, 0, Math.PI * 2);
  ctx.fill();

  // Recipes
  let y = HEADER_HEIGHT + BASE_TITLE_GAP * scale;
  data.recipes.forEach((recipe, i) => {
    const { lines, blockHeight } = layouts[i];
    ctx.fillStyle = TERRACOTTA;
    ctx.font = `italic 700 ${BASE_TITLE_SIZE * scale}px ${font}`;
    ctx.fillText(recipe.title, contentLeft, y);
    ctx.fillStyle = INK_DARK;
    ctx.font = `500 ${BASE_LINE_SIZE * scale}px ${font}`;
    lines.forEach((line, li) => {
      ctx.fillText(line, contentLeft, y + BASE_TITLE_GAP * scale + li * BASE_LINE_HEIGHT * scale);
    });
    y += blockHeight;
  });

  // Date / headcount, bottom-left, italic accent
  if (data.eventDateLabel || data.headcountLabel) {
    ctx.fillStyle = TERRACOTTA;
    ctx.font = `italic 700 30px ${font}`;
    const parts = [data.eventDateLabel, data.headcountLabel].filter(Boolean);
    ctx.fillText(parts.join("  ·  "), contentLeft, HEIGHT - footerHeight + 20);
  }

  // Big vertical title along the right edge, read bottom-to-top
  ctx.save();
  ctx.translate(WIDTH - 56, HEIGHT - PADDING * 0.6);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = TERRACOTTA;
  ctx.font = `800 76px ${font}`;
  ctx.textBaseline = "middle";
  ctx.fillText(data.title, 0, 0);
  ctx.restore();

  // Faint divider between the content and the right rail
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentRight, 40);
  ctx.lineTo(contentRight, HEIGHT - 40);
  ctx.stroke();

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export type MealPlanCardTemplate = {
  id: string;
  label: string;
  render: (data: MealPlanCardData) => Promise<Blob | null>;
};

// Same layout, two font choices — add more fonts here, not more layouts.
export const MEAL_PLAN_CARD_TEMPLATES: MealPlanCardTemplate[] = [
  { id: "sans", label: "기본", render: (data) => renderTemplate(data, SANS_FONT) },
  { id: "serif", label: "명조", render: (data) => renderTemplate(data, SERIF_FONT) },
];
