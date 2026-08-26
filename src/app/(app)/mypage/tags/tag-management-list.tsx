"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ClearableInput } from "@/components/ClearableInput";
import { renameHouseholdTag } from "@/lib/actions/recipes";
import { useDict } from "@/lib/i18n/client";

function TagRow({ tag, onRenamed }: { tag: string; onRenamed: (oldName: string, newName: string) => void }) {
  const dict = useDict();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tag);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === tag) {
      setEditing(false);
      setValue(tag);
      return;
    }
    startTransition(async () => {
      await renameHouseholdTag(tag, trimmed);
      onRenamed(tag, trimmed);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <ClearableInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            autoFocus
            className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none focus:outline-accent"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "..." : dict.mypage.tagRenameSave}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <span className="min-w-0 truncate text-sm font-semibold text-ink">#{tag}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 text-xs font-bold text-accent-ink"
      >
        {dict.mypage.tagRename}
      </button>
    </div>
  );
}

export function TagManagementList({ tags }: { tags: string[] }) {
  const [list, setList] = useState(tags);

  function handleRenamed(oldName: string, newName: string) {
    setList((prev) => prev.map((t) => (t === oldName ? newName : t)));
  }

  return (
    <GlassCard className="bg-white">
      <div className="divide-y divide-border">
        {list.map((tag) => (
          <TagRow key={tag} tag={tag} onRenamed={handleRenamed} />
        ))}
      </div>
    </GlassCard>
  );
}
