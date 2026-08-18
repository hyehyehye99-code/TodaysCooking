"use client";

import { useActionState, useRef, useState } from "react";
import { addCookLog } from "@/lib/actions/recipes";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function CookLogForm({ recipeId }: { recipeId: string }) {
  const [state, formAction, pending] = useActionState(addCookLog, undefined);
  const [rating, setRating] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        setTimeout(() => {
          formRef.current?.reset();
          setRating(0);
        }, 0);
      }}
      className="flex flex-col gap-3 rounded-2xl border border-transparent bg-surface p-4"
    >
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="rating" value={rating || ""} />

      <input
        type="file"
        name="photo"
        accept="image/*"
        required
        className="text-xs text-ink-soft"
      />

      <div className="flex items-center gap-3">
        <input
          type="date"
          name="cookedAt"
          defaultValue={todayISO()}
          className="rounded-lg border border-transparent bg-white px-3 py-2 text-xs outline-none"
        />
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}점`}
              className="text-lg leading-none"
              style={{ color: n <= rating ? "var(--color-warn)" : "var(--color-ink-faint)" }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-xs font-bold text-white disabled:opacity-60"
      >
        {pending ? "업로드 중..." : "사진 추가"}
      </button>
    </form>
  );
}
