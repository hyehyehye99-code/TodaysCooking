// Renders a shareable "메뉴판" card as a PNG — plain Canvas 2D drawing, no
// recipe/link photos involved on purpose: those are frequently hotlinked
// from YouTube/Instagram CDNs without CORS headers, which would taint the
// canvas and block toBlob() entirely. Text + emoji only keeps export
// reliable everywhere.

export type MealPlanCardRecipe = { title: string; ingredientNames: string[] };
export type MealPlanCardData = {
  title: string;
  eventDateLabel: string | null;
  headcountLabel: string | null;
  recipes: MealPlanCardRecipe[];
};

const WIDTH = 1080;
const PADDING = 72;
const FONT = '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const ACCENT = "#e8603c";
const ACCENT_INK = "#7a2a12";
const INK = "#191f28";
const INK_SOFT = "#6b7684";
const SURFACE = "#f9fafb";
const BORDER = "#f0f1f3";

// Not ctx.roundRect() — that's iOS 16+ only, and this card should still
// render (just with square corners the very rare unsupported device) rather
// than throw.
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function layoutRecipe(ctx: CanvasRenderingContext2D, recipe: MealPlanCardRecipe, contentWidth: number) {
  ctx.font = `600 34px ${FONT}`;
  const ingredientLines = wrapText(ctx, recipe.ingredientNames.join(" · ") || "-", contentWidth - 32);
  const blockHeight = 56 + 8 + ingredientLines.length * 44 + 40; // title + gap + lines + bottom spacing
  return { ingredientLines, blockHeight };
}

export async function renderMealPlanCard(data: MealPlanCardData): Promise<Blob | null> {
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) return null;

  const contentWidth = WIDTH - PADDING * 2;
  const layouts = data.recipes.map((r) => layoutRecipe(mctx, r, contentWidth));
  const recipesHeight = layouts.reduce((sum, l) => sum + l.blockHeight, 0);

  const headerHeight = 260;
  const metaHeight = data.eventDateLabel || data.headcountLabel ? 90 : 0;
  const footerHeight = 100;
  const height = headerHeight + metaHeight + recipesHeight + footerHeight + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  // Header band
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, WIDTH, headerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 30px ${FONT}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("🍳 우리집 레시피 메뉴판", PADDING, 92);
  ctx.font = `800 64px ${FONT}`;
  const titleLines = wrapText(ctx, data.title, contentWidth);
  titleLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, PADDING, 170 + i * 74);
  });

  let y = headerHeight + 64;

  // Date / headcount pills
  if (data.eventDateLabel || data.headcountLabel) {
    let x = PADDING;
    ctx.font = `600 30px ${FONT}`;
    for (const label of [data.eventDateLabel, data.headcountLabel]) {
      if (!label) continue;
      const w = ctx.measureText(label).width + 48;
      ctx.fillStyle = SURFACE;
      roundedRect(ctx, x, y - 44, w, 58, 29);
      ctx.fill();
      ctx.fillStyle = ACCENT_INK;
      ctx.fillText(label, x + 24, y - 5);
      x += w + 16;
    }
    y += metaHeight;
  }

  // Recipes
  data.recipes.forEach((recipe, i) => {
    const { ingredientLines, blockHeight } = layouts[i];
    ctx.fillStyle = ACCENT_INK;
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(`${i + 1}. ${recipe.title}`, PADDING, y);
    ctx.fillStyle = INK_SOFT;
    ctx.font = `400 30px ${FONT}`;
    ingredientLines.forEach((line, li) => {
      ctx.fillText(line, PADDING, y + 44 + li * 40);
    });
    const dividerY = y + (blockHeight - 20);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING, dividerY);
    ctx.lineTo(WIDTH - PADDING, dividerY);
    ctx.stroke();
    y += blockHeight;
  });

  // Footer
  ctx.fillStyle = INK;
  ctx.font = `600 26px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("우리집 레시피로 만든 메뉴판", WIDTH / 2, height - PADDING / 2);
  ctx.textAlign = "left";

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
