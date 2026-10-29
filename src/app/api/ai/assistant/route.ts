import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { generateRecipeFromLink } from "@/lib/actions/ai-recipe";
import { runAssistantChat, sanitizeIdeas } from "@/lib/assistant/chat";
import { pickDishEmoji } from "@/lib/assistant/dish-emoji";
import {
  addShoppingItems,
  loadKitchenContext,
  missingIngredients,
  saveRecipeForHousehold,
} from "@/lib/assistant/household-data";
import type {
  AssistantReply,
  AssistantRequest,
  AssistantStreamEvent,
} from "@/lib/assistant/types";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) return json({ error: "AI 기능이 아직 설정되지 않았어요." }, 503);

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return json({ error: "로그인이 필요해요." }, 401);

  let body: AssistantRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "잘못된 요청이에요." }, 400);
  }

  const supabase = await createClient();
  const ctx = { householdId: household.id, userId: user.id };

  if (body.kind === "save_idea") {
    const [idea] = sanitizeIdeas([body.idea]);
    if (!idea) return json({ error: "저장할 레시피가 올바르지 않아요." }, 400);
    const saved = await saveRecipeForHousehold(supabase, ctx, idea);
    return saved.ok ? json({ id: saved.id }) : json({ error: saved.error }, 500);
  }

  if (body.kind === "add_shopping") {
    const items = Array.isArray(body.items) ? body.items.filter((i) => typeof i === "string") : [];
    const result = await addShoppingItems(supabase, household.id, items);
    return "error" in result ? json({ error: "장보기에 담지 못했어요." }, 500) : json(result);
  }

  if (body.kind !== "chat" || !Array.isArray(body.messages)) return json({ error: "잘못된 요청이에요." }, 400);

  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  if (!lastUser || typeof lastUser.text !== "string" || !lastUser.text.trim()) {
    return json({ error: "메시지가 비어 있어요." }, 400);
  }
  const link = lastUser.text.match(URL_PATTERN)?.[0];

  // Streams NDJSON so the link flow can report real progress ("step" events)
  // before the final "result" — the other intents just emit the result.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: AssistantStreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        if (link) {
          send({ type: "step", step: 1 });
          const generated = await generateRecipeFromLink(link);
          if (!generated.ok) {
            send({ type: "error", error: generated.error, limitReached: generated.limitReached });
            return;
          }

          send({ type: "step", step: 2 });
          const title = generated.title?.trim() || "새 레시피";
          const idea = sanitizeIdeas([
            {
              title,
              emoji: pickDishEmoji(`${title} ${generated.tags.join(" ")}`),
              summary: generated.tags.slice(0, 3).join(" · "),
              // generateRecipeFromLink already folded amounts into "이름 용량"
              // lines; saveRecipeForHousehold re-parses them with the same rules.
              ingredients: generated.ingredients.map((name) => ({ name, amount: "" })),
              instructions: generated.instructions,
              tags: generated.tags,
            },
          ])[0];
          if (!idea) {
            send({ type: "error", error: "레시피를 정리하지 못했어요." });
            return;
          }

          send({ type: "step", step: 3 });
          const saved = await saveRecipeForHousehold(supabase, ctx, { ...idea, referenceUrl: link });
          if (!saved.ok) {
            send({ type: "error", error: saved.error });
            return;
          }

          const kitchen = await loadKitchenContext(supabase, household.id);
          const savedRecipe = kitchen.recipes.find((r) => r.id === saved.id);
          const names = savedRecipe?.recipe_ingredients.map((i) => i.name) ?? [];
          const missing = missingIngredients(names, kitchen.owned);

          const reply: AssistantReply = {
            text: `맛있는 ${title} 레시피를 주방에 쏙 넣어뒀어요! ${idea.emoji}`,
            recipes: savedRecipe
              ? [
                  {
                    id: saved.id,
                    title,
                    emoji: idea.emoji,
                    summary: idea.summary,
                    ingredients: names.slice(0, 6),
                    ownedCount: names.length - missing.length,
                    totalCount: names.length,
                  },
                ]
              : [],
            ideas: [],
            actions: [
              ...(missing.length
                ? [{ kind: "add_shopping" as const, label: "🛒 부족한 재료 장보기 목록에 담기", items: missing }]
                : []),
              { kind: "prompt", label: "🍲 어울리는 국/반찬 추천받기", prompt: `${title}에 어울리는 국이나 반찬 추천해줘`, mode: "send" },
              { kind: "prompt", label: "🔗 다른 링크 또 등록하기", prompt: "", mode: "fill" },
            ],
          };
          send({ type: "result", reply });
          return;
        }

        const kitchen = await loadKitchenContext(supabase, household.id);
        const result = await runAssistantChat(body.messages, kitchen);
        send(result.ok ? { type: "result", reply: result.reply } : { type: "error", error: result.error });
      } catch {
        send({ type: "error", error: "문제가 생겼어요. 잠시 후 다시 시도해주세요." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}
