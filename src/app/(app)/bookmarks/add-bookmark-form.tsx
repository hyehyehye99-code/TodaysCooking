"use client";

import { useActionState, useEffect, useRef } from "react";
import { addBookmark } from "@/lib/actions/bookmarks";

export function AddBookmarkForm() {
  const [state, formAction, pending] = useActionState(addBookmark, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 rounded-2xl border border-transparent bg-surface px-3.5 py-3">
        <input
          name="url"
          required
          placeholder="링크를 붙여넣어 저장하세요"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
      {state?.error && <p className="px-1 text-xs text-warn-ink">{state.error}</p>}
    </form>
  );
}
