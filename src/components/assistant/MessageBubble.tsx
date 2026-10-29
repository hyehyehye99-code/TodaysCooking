"use client";

import type { AssistantAction, AssistantIdea, ChatMessage } from "@/lib/assistant/types";
import { RecipeResultCard } from "@/components/assistant/RecipeResultCard";
import { IdeaCard } from "@/components/assistant/IdeaCard";
import type { MascotName } from "@/components/Mascot";
import { ChefAvatar } from "@/components/assistant/ChefAvatar";
import { SuggestionChips } from "@/components/assistant/SuggestionChips";

function moodMascot(m: Extract<ChatMessage, { role: "assistant" }>): MascotName {
  if (m.error) return "puzzled";
  if (m.reply.ideas.length > 0) return "idea";
  if (m.reply.recipes.length > 0) return "thumbs-up";
  return "chef-greeting";
}

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
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-tr-md bg-gradient-to-br from-accent to-[#d9522f] px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
          {message.text}
        </p>
      </div>
    );
  }

  const { reply } = message;
  return (
    <div className="flex items-start gap-2.5">
      <ChefAvatar size={36} mascot={moodMascot(message)} />
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div
          className={`max-w-full rounded-3xl rounded-tl-md border bg-white px-4 py-3 shadow-sm ${
            message.error ? "border-red-200 text-red-700" : "border-stone-200/60 text-stone-800"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{reply.text}</p>
        </div>
        {(reply.recipes.length > 0 || reply.ideas.length > 0) && (
          <div className="mt-2.5 flex w-full flex-col gap-2.5">
            {reply.recipes.map((c) => (
              <RecipeResultCard key={c.id} card={c} />
            ))}
            {reply.ideas.map((idea) => (
              <IdeaCard key={idea.title} idea={idea} onSave={onSaveIdea} />
            ))}
          </div>
        )}
        {showActions && reply.actions.length > 0 && (
          <SuggestionChips actions={reply.actions} onAddShopping={onAddShopping} onPrompt={onPrompt} />
        )}
      </div>
    </div>
  );
}
