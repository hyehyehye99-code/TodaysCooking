import { GoogleGenAI, Type } from "@google/genai";
import { pickDishEmoji } from "@/lib/assistant/dish-emoji";
import { missingIngredients, toRecipeCard, type KitchenContext } from "@/lib/assistant/household-data";
import type { AssistantAction, AssistantIdea, AssistantReply } from "@/lib/assistant/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_HISTORY = 10;
const MAX_TEXT = 600;

const SYSTEM_PROMPT = [
  "너는 '혜콩이네 주방'을 함께 돌보는 다정하고 똑 부러진 전담 셰프 비서야.",
  "말투는 친근하고 싹싹한 해요체. 이모지는 한두 개만 자연스럽게. 군더더기 없이 실용적으로 답해.",
  "",
  "사용자 의도를 아래 중 하나로 분류해 intent에 넣어:",
  "- fridge_recommend: 가진 재료로 뭘 만들지 묻는 경우. 유통기한이 임박했거나 지난 재료(아래 목록에 표시됨)를 먼저 소진하는",
  "  메뉴를 최우선으로 고르고, reply에서 어떤 재료가 임박했는지 한 번 짚어줘. 이미 지난 재료는 상태를 확인하라고 안내해.",
  "  그 다음 '우리 레시피북' 목록에서 해당 재료가 들어간 메뉴를",
  "  existingRecipeIds에 최대 3개 골라. 그 뒤 새로운 메뉴 아이디어를 1~2개 ideas에 제안해(핵심 재료·조리법 포함).",
  "- cooking_qa: 재료 대체, 계량 변환(예: 2인분→4인분), 조리 팁 질문. 구체적인 대체 비율·수치를 reply에 써줘. ideas는 비워.",
  "- theme_recommend: 시간·상황·테마(10분 안주, 다이어트 단백질 등) 추천. 레시피북에서 어울리는 것과 새 아이디어를 섞어서.",
  "- chitchat: 위에 해당하지 않는 일반 대화나 요리와 무관한 요청. 요리 이야기로 부드럽게 유도하고 ideas는 비워.",
  "",
  "규칙:",
  "- existingRecipeIds에는 반드시 아래 '우리 레시피북' 목록에 있는 id만 넣어. 지어내지 마.",
  "- 냉장고에 있다고 알려진 재료와 사용자가 말한 재료를 모두 고려해.",
  "- ideas의 재료 name에는 이름만, 분량은 amount에 분리해. 분량이 불확실하면 빈 문자열.",
  "- ideas.instructions는 줄바꿈(\\n)으로 단계를 나눈 한국어 텍스트.",
  "- reply는 1~4문장. 카드로 보여줄 메뉴 내용을 reply에 다시 길게 풀어 쓰지 마.",
  "- followUps에는 다음에 누를 만한 짧은 제안 문구(이모지 포함, 20자 이내)를 2~3개.",
].join("\n");

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ["fridge_recommend", "cooking_qa", "theme_recommend", "chitchat"],
    },
    reply: { type: Type.STRING, description: "사용자에게 보여줄 친근한 답변 코멘트" },
    existingRecipeIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "우리 레시피북 목록에서 고른 레시피 id (최대 3개)",
    },
    ideas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          emoji: { type: Type.STRING, description: "요리를 대표하는 이모지 1개" },
          summary: { type: Type.STRING, description: "한 줄 소개" },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } },
              required: ["name", "amount"],
            },
          },
          instructions: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "emoji", "summary", "ingredients", "instructions", "tags"],
      },
    },
    followUps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["intent", "reply", "existingRecipeIds", "ideas", "followUps"],
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// The model's output is only trusted after this pass: ids must exist in the
// household's own list, idea fields are coerced, and everything is capped.
export function sanitizeIdeas(raw: unknown): AssistantIdea[] {
  if (!Array.isArray(raw)) return [];
  const ideas: AssistantIdea[] = [];
  for (const r of raw.slice(0, 2)) {
    if (typeof r !== "object" || r === null) continue;
    const o = r as Record<string, unknown>;
    const title = str(o.title).slice(0, 60);
    const ingredients = (Array.isArray(o.ingredients) ? o.ingredients : [])
      .map((i) => {
        const x = (i ?? {}) as Record<string, unknown>;
        return { name: str(x.name).slice(0, 40), amount: str(x.amount).slice(0, 30) };
      })
      .filter((i) => i.name)
      .slice(0, 30);
    if (!title || ingredients.length === 0) continue;
    ideas.push({
      title,
      emoji: str(o.emoji).slice(0, 8) || pickDishEmoji(title),
      summary: str(o.summary).slice(0, 80),
      ingredients,
      instructions: str(o.instructions).replace(/\\n/g, "\n").slice(0, 3000),
      tags: (Array.isArray(o.tags) ? o.tags : []).map(str).filter(Boolean).slice(0, 4),
    });
  }
  return ideas;
}

function fridgeLine(f: KitchenContext["fridge"][number]) {
  if (f.days === null) return f.name;
  if (f.days < 0) return `${f.name}(유통기한 ${-f.days}일 지남)`;
  if (f.days === 0) return `${f.name}(오늘까지)`;
  return `${f.name}(D-${f.days})`;
}

function kitchenSummary(ctx: KitchenContext) {
  const recipes = ctx.recipes
    .filter((r) => r.title)
    .map((r) => `- ${r.id} | ${r.title} | ${r.recipe_ingredients.map((i) => i.name).join(", ")}`)
    .join("\n");
  return [
    `냉장고에 있는 재료 (유통기한 임박순): ${
      ctx.fridge.length
        ? [...ctx.fridge]
            .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity))
            .map(fridgeLine)
            .join(", ")
        : "(등록된 재료 없음)"
    }`,
    "우리 레시피북 (id | 이름 | 재료):",
    recipes || "(아직 비어 있음)",
  ].join("\n");
}

export async function runAssistantChat(
  messages: { role: "user" | "assistant"; text: string }[],
  ctx: KitchenContext
): Promise<{ ok: true; reply: AssistantReply } | { ok: false; error: string }> {
  const history = messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text.slice(0, MAX_TEXT) }],
  }));
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return { ok: false, error: "메시지가 비어 있어요." };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: history,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\n${kitchenSummary(ctx)}`,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
    const data = JSON.parse(response.text ?? "");

    const byId = new Map(ctx.recipes.map((r) => [r.id, r]));
    const ids: string[] = Array.isArray(data.existingRecipeIds) ? data.existingRecipeIds : [];
    const recipes = [...new Set(ids)]
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .slice(0, 3)
      .map((r) => toRecipeCard(r, ctx.owned));
    const ideas = sanitizeIdeas(data.ideas);

    const actions: AssistantAction[] = [];
    const missing = [
      ...new Set([
        ...recipes.flatMap((c) => {
          const full = byId.get(c.id);
          return missingIngredients(full?.recipe_ingredients.map((i) => i.name) ?? [], ctx.owned);
        }),
        ...ideas.flatMap((i) => missingIngredients(i.ingredients.map((x) => x.name), ctx.owned)),
      ]),
    ];
    if (missing.length > 0) {
      actions.push({ kind: "add_shopping", label: "🛒 부족한 재료 장보기 목록에 담기", items: missing.slice(0, 30) });
    }
    for (const f of (Array.isArray(data.followUps) ? data.followUps : []).map(str).filter(Boolean).slice(0, 3)) {
      actions.push({ kind: "prompt", label: f.slice(0, 30), prompt: f, mode: "send" });
    }

    const text = str(data.reply);
    if (!text) return { ok: false, error: "AI가 답변을 생성하지 못했어요." };
    return { ok: true, reply: { text, recipes, ideas, actions } };
  } catch {
    return { ok: false, error: "AI 요청에 실패했어요. 잠시 후 다시 시도해주세요." };
  }
}
