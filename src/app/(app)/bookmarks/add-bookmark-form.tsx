"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addBookmark } from "@/lib/actions/bookmarks";
import { Modal } from "@/components/Modal";
import { ClearableInput } from "@/components/ClearableInput";
import { TagPicker } from "@/components/TagPicker";
import { FieldLabel } from "@/components/FieldLabel";
import { useClipboardLinkSuggestion } from "@/lib/useClipboardLinkSuggestion";
import { useDict } from "@/lib/i18n/client";

export function AddBookmarkForm({ existingTags }: { existingTags: string[] }) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(addBookmark, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const open = searchParams.get("add") === "1";
  const { suggestion, dismiss } = useClipboardLinkSuggestion("", open);

  function useSuggestion() {
    const input = urlInputRef.current;
    if (!input || !suggestion) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, suggestion);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    dismiss();
  }

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
          <p className="text-[15px] font-bold">{dict.bookmarks.addLinkHeading}</p>
          <button
            type="button"
            onClick={close}
            aria-label={dict.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          {suggestion && (
            <div className="flex items-center gap-2 rounded-xl bg-accent/8 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                {dict.components.clipboardSuggestionPrefix}
                <span className="font-semibold text-ink">{suggestion}</span>
              </span>
              <button
                type="button"
                onClick={useSuggestion}
                className="shrink-0 rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-white"
              >
                {dict.components.useSuggestion}
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label={dict.common.close}
                className="shrink-0 text-xs text-ink-faint"
              >
                ×
              </button>
            </div>
          )}
          <ClearableInput
            ref={urlInputRef}
            name="url"
            required
            placeholder={dict.bookmarks.urlPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          <ClearableInput
            name="note"
            placeholder={dict.bookmarks.notePlaceholderOptional}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          <div>
            <FieldLabel>{dict.recipes.tagsLabel}</FieldLabel>
            <TagPicker name="tags" existingTags={existingTags} />
          </div>
          {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? dict.recipes.saving : dict.common.save}
          </button>
        </form>
      </div>
    </Modal>
  );
}
