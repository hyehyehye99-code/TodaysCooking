"use client";

import { useActionState, useEffect, useRef } from "react";
import { addBookmark } from "@/lib/actions/bookmarks";
import { GlassCard } from "@/components/ui";

export function AddBookmarkForm() {
  const [state, formAction, pending] = useActionState(addBookmark, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <GlassCard className="bg-white p-4">
      <p className="mb-3 text-[13px] font-bold">링크 저장</p>
      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <input
          name="url"
          required
          placeholder="링크를 붙여넣으세요"
          className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
        <input
          name="note"
          placeholder="메모 (선택)"
          className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
        {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </form>
    </GlassCard>
  );
}
