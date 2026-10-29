"use client";

import type { AssistantAction, AssistantIdea, ChatMessage } from "@/lib/assistant/types";
import { RecipeResultCard } from "@/components/assistant/RecipeResultCard";
import { IdeaCard } from "@/components/assistant/IdeaCard";
import { SuggestionChips } from "@/components/assistant/SuggestionChips";

export function MessageBubble({
  message,
  showActions,
  onAddShopping,
  onPrompt,
  onSaveIdea,
}: {
  message: ChatMessage;
  showActions: boolean;
  onAddShopping: (action: Extract<AssistantAction, { kind: "add_shopping" }>) => Promise<boolean>;
  onPrompt: (action: Extract<AssistantAction, { kind: "prompt" }>) => void;
  onSaveIdea: (idea: AssistantIdea) => Promise<string | null>;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
          {message.text}
        </p>
      </div>
    );
  }

  const { reply } = message;
  return (
    <div className="flex flex-col items-start">
      <div
        className={`max-w-[92%] rounded-2xl rounded-tl-sm border bg-white px-4 py-3 shadow-sm ${
          message.error ? "border-red-200 text-red-700" : "border-stone-200/60 text-stone-800"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{reply.text}</p>
        {(reply.recipes.length > 0 || reply.ideas.length > 0) && (
          <div className="mt-3 flex flex-col gap-2.5">
            {reply.recipes.map((c) => (
              <RecipeResultCard key={c.id} card={c} />
            ))}
            {reply.ideas.map((idea) => (
              <IdeaCard key={idea.title} idea={idea} onSave={onSaveIdea} />
            ))}
          </div>
        )}
      </div>
      {showActions && reply.actions.length > 0 && (
        <SuggestionChips actions={reply.actions} onAddShopping={onAddShopping} onPrompt={onPrompt} />
      )}
    </div>
  );
}
