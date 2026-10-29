// Shared by the /api/ai/assistant route and the chat UI — kept free of any
// server-only imports so client components can use it.

export type AssistantIdea = {
  title: string;
  emoji: string;
  summary: string;
  ingredients: { name: string; amount: string }[];
  instructions: string;
  tags: string[];
};

export type AssistantRecipeCard = {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  ingredients: string[];
  ownedCount: number;
  totalCount: number;
};

export type AssistantAction =
  | { kind: "add_shopping"; label: string; items: string[] }
  // "fill" drops the text into the input box for the user to finish; "send" sends it as-is.
  | { kind: "prompt"; label: string; prompt: string; mode: "send" | "fill" };

export type AssistantReply = {
  text: string;
  recipes: AssistantRecipeCard[];
  ideas: AssistantIdea[];
  actions: AssistantAction[];
};

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; reply: AssistantReply; error?: boolean };

export type AssistantRequest =
  | { kind: "chat"; messages: { role: "user" | "assistant"; text: string }[] }
  | { kind: "save_idea"; idea: AssistantIdea }
  | { kind: "add_shopping"; items: string[] };

export type AssistantUsage = { percent: number; bonusRemaining: number; unlimited: boolean };

// One NDJSON line per event on the chat stream.
export type AssistantStreamEvent =
  | { type: "step"; step: 1 | 2 | 3 }
  | { type: "result"; reply: AssistantReply; usage: AssistantUsage }
  | { type: "error"; error: string; limitReached?: boolean; usage?: AssistantUsage };

export const LINK_STEPS = [
  "📹 영상 정보와 조리 과정을 읽고 있어요...",
  "🥕 재료와 정확한 계량을 정리하는 중이에요...",
  "🍳 혜콩이네 레시피북에 예쁘게 저장 중이에요...",
] as const;
