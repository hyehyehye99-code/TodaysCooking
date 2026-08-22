"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { extractYoutubeVideoId, fetchYoutubeVideoDetails } from "@/lib/actions/youtube";

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
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "재료 이름만. 용량·수량은 절대 포함하지 마. 예: '돼지고기', '신김치'.",
          },
          amount: {
            type: Type.STRING,
            description: "용량이나 수량만. 예: '200g', '2컵', '1큰술'. 알 수 없으면 빈 문자열.",
          },
        },
        required: ["name", "amount"],
      },
      description:
        "재료 목록. 냉장고·장보기 목록의 재료명과 그대로 매칭돼야 하므로, name에는 반드시 이름만 넣고 amount에 용량을 분리해서 넣어. isRecipe가 false면 빈 배열.",
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

  // Server Actions are reachable directly (their endpoint ships in the
  // client bundle), not just through this button — without this check,
  // anyone who found the action id could rack up Gemini/YouTube API calls
  // without ever logging in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const preview = await fetchLinkPreview(url);
  if (!preview.ok) return { ok: false, error: preview.error };
  if (!preview.title) {
    return { ok: false, error: "링크에서 정보를 가져오지 못했어요." };
  }

  // oEmbed (used for the title/thumbnail above) doesn't expose the video's
  // description or comments — but that's frequently exactly where a creator
  // pastes the actual written recipe. Pull it via the YouTube Data API when
  // configured, so the model can extract the real thing instead of guessing.
  const videoId = extractYoutubeVideoId(url);
  const videoDetails = videoId ? await fetchYoutubeVideoDetails(videoId) : null;

  const contextLines = [`링크: ${preview.url}`, `제목: ${preview.title}`];
  if (videoDetails?.description) {
    contextLines.push(`영상 설명란:\n${videoDetails.description}`);
  } else if (preview.description) {
    contextLines.push(`설명: ${preview.description}`);
  }
  if (videoDetails?.comments.length) {
    contextLines.push(
      "댓글:",
      ...videoDetails.comments.map(
        (c, i) => `${i + 1}. ${c.isCreator ? "[창작자 댓글] " : ""}${c.text}`
      )
    );
  }
  const context = contextLines.join("\n");
  const hasRealContent = !!(videoDetails?.description || videoDetails?.comments.length || preview.description);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        "아래는 어떤 링크(영상/게시물)의 정보야. 먼저 이 내용이 실제 요리·음식 레시피가 맞는지",
        "판단해. 요리와 무관한 내용이라면 isRecipe를 false로 하고 나머지 필드는 비워둬 — 제목에",
        "있는 단어를 억지로 요리나 칵테일 등에 끼워맞추지 마.",
        "",
        hasRealContent
          ? [
              "레시피가 맞다면, 아래 영상 설명란·댓글 중에 작성자가 실제로 올려둔 재료·분량·조리",
              "순서가 있으면 그 내용을 최대한 그대로 가져와서 정리해줘 (재료명, 분량, 순서 포함).",
              "절대 지어내지 말고 실제로 적힌 내용을 우선해. 설명/댓글에 일부만 나와 있으면 그",
              "부분은 그대로 쓰고, 빠진 부분만 일반적인 조리법으로 합리적으로 채워.",
            ].join("\n")
          : [
              "이 링크에서는 제목 외에 실제 내용을 가져올 수 없었어. 제목에서 짐작할 수 있는",
              "일반적이고 실제로 통용되는 방식으로 재료와 만드는 법을 작성해. 확실하지 않은 세부",
              "분량은 일반적인 가정 요리 기준으로 합리적으로 채워.",
            ].join("\n"),
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

    const rawIngredients: { name: string; amount: string }[] = Array.isArray(data.ingredients)
      ? data.ingredients
          .map((i: unknown) => {
            if (typeof i !== "object" || i === null) return null;
            const { name, amount } = i as { name?: unknown; amount?: unknown };
            if (typeof name !== "string" || !name.trim()) return null;
            return { name: name.trim(), amount: typeof amount === "string" ? amount.trim() : "" };
          })
          .filter((i: { name: string; amount: string } | null): i is { name: string; amount: string } => i !== null)
      : [];
    if (rawIngredients.length === 0) {
      return { ok: false, error: "AI가 재료를 만들어내지 못했어요." };
    }

    // Each line goes into the same "재료" box a manual entry would use, in
    // the same "이름 용량" shape (e.g. "문어 400g") — saving the recipe runs
    // this through the very same name/amount split as manual entries, so the
    // ingredients box is naturally its own section, separate from
    // instructions, with the amount preserved and shown on the recipe's
    // ingredient chips instead of being folded into the instructions text.
    const ingredients = rawIngredients.map((i) => (i.amount ? `${i.name} ${i.amount}` : i.name));
    // The model occasionally emits a literal backslash-n instead of an
    // actual line break (an inconsistent JSON-escaping quirk, not specific
    // to any one input) — normalize both to real newlines so the textarea
    // never shows a stray "\n" instead of wrapping.
    const instructions =
      typeof data.instructions === "string" ? data.instructions.replace(/\\n/g, "\n") : "";

    return {
      ok: true,
      title: typeof data.title === "string" ? data.title : null,
      ingredients,
      instructions,
      tags: Array.isArray(data.tags) ? data.tags.filter((t: unknown): t is string => typeof t === "string") : [],
    };
  } catch {
    return { ok: false, error: "AI 요청에 실패했어요. 잠시 후 다시 시도해주세요." };
  }
}
