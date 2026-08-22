"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isRecipe: {
      type: Type.BOOLEAN,
      description:
        "이 링크의 제목/설명이 실제 요리·음식 레시피 내용인지 여부. 요리와 무관한 내용(예: 프로그래밍, 노래, 브이로그, 리뷰 등)이면 false로 하고, 절대 무관한 내용을 요리에 억지로 끼워맞추지 마.",
    },
    title: { type: Type.STRING, description: "요리 이름. 원래 제목이 이미 요리 이름이면 그대로. isRecipe가 false면 생략." },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "재료 목록. 각 항목은 '재료명' 또는 '재료명 분량' 형태의 짧은 한국어 문자열. isRecipe가 false면 빈 배열.",
    },
    instructions: {
      type: Type.STRING,
      description:
        "만드는 법. '1. ...' 형태로 번호를 매긴 단계들을 실제 줄바꿈 문자(\\n)로 구분한 한국어 텍스트. 한 줄에 한 단계씩. isRecipe가 false면 빈 문자열.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "요리를 분류할 짧은 한국어 태그 1~4개 (예: 한식, 국물요리, 간단요리). isRecipe가 false면 빈 배열.",
    },
  },
  required: ["isRecipe", "ingredients", "instructions"],
};

export async function generateRecipeFromLink(
  url: string
): Promise<
  | { ok: true; title: string | null; ingredients: string[]; instructions: string; tags: string[] }
  | { ok: false; error: string }
> {
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, error: "AI 기능이 아직 설정되지 않았어요." };
  }

  const preview = await fetchLinkPreview(url);
  if (!preview.ok) return { ok: false, error: preview.error };
  if (!preview.title) {
    return { ok: false, error: "링크에서 정보를 가져오지 못했어요." };
  }

  const context = [
    `링크: ${preview.url}`,
    `제목: ${preview.title}`,
    preview.description ? `설명: ${preview.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        "아래는 어떤 링크(영상/게시물)의 제목과 설명이야. 먼저 이 내용이 실제 요리·음식 레시피가",
        "맞는지 판단해. 요리와 무관한 내용이라면 isRecipe를 false로 하고 나머지 필드는 비워둬 —",
        "제목에 있는 단어를 억지로 요리나 칵테일 등에 끼워맞추지 마.",
        "",
        "레시피가 맞다면, 그 요리를 만들기 위한 재료 목록과 만드는 법을 한국어로 작성해줘.",
        "영상 내용을 직접 볼 수는 없으니, 제목과 설명에서 짐작할 수 있는 일반적이고 실제로",
        "통용되는 방식으로 작성해. 확실하지 않은 세부 분량은 일반적인 가정 요리 기준으로",
        "합리적으로 채워.",
        "",
        context,
      ].join("\n"),
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return { ok: false, error: "AI가 답변을 생성하지 못했어요." };

    const data = JSON.parse(text);
    if (data.isRecipe === false) {
      return { ok: false, error: "이 링크는 요리 레시피가 아닌 것 같아요." };
    }

    const ingredients = Array.isArray(data.ingredients)
      ? data.ingredients.filter((i: unknown): i is string => typeof i === "string")
      : [];
    if (ingredients.length === 0) {
      return { ok: false, error: "AI가 재료를 만들어내지 못했어요." };
    }

    return {
      ok: true,
      title: typeof data.title === "string" ? data.title : null,
      ingredients,
      instructions: typeof data.instructions === "string" ? data.instructions : "",
      tags: Array.isArray(data.tags) ? data.tags.filter((t: unknown): t is string => typeof t === "string") : [],
    };
  } catch {
    return { ok: false, error: "AI 요청에 실패했어요. 잠시 후 다시 시도해주세요." };
  }
}
