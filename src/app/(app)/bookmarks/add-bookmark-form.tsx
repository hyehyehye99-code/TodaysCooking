"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addBookmark } from "@/lib/actions/bookmarks";
import { Modal } from "@/components/Modal";

export function AddBookmarkForm() {
  const [state, formAction, pending] = useActionState(addBookmark, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const open = searchParams.get("add") === "1";

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.replace("/bookmarks");
    }
  }, [state, router]);

  function close() {
    router.replace("/bookmarks");
  }

  return (
    <Modal open={open} onClose={close} variant="sheet">
      <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-bold">링크 추가하기</p>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

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
      </div>
    </Modal>
  );
}
