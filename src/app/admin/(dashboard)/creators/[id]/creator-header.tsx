"use client";

import { useState } from "react";
import { EditCreatorForm } from "./edit-creator-form";
import { DeleteCreatorButton } from "./delete-creator-button";

type Creator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  channel_type: string | null;
  channel_name: string | null;
  channel_link: string | null;
  tags: string[];
};

export function CreatorHeader({ creator, recipeCount }: { creator: Creator; recipeCount: number }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-white p-4">
        <p className="mb-3 text-sm font-bold">크리에이터 정보 수정</p>
        <EditCreatorForm creator={creator} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{creator.icon_emoji ?? "👤"}</span>
        <div>
          <h1 className="text-xl font-bold">{creator.name}</h1>
          {creator.channel_type && <p className="text-xs text-ink-soft">{creator.channel_type}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-ink-soft"
        >
          정보 수정
        </button>
        <DeleteCreatorButton creatorId={creator.id} recipeCount={recipeCount} />
      </div>
    </div>
  );
}
