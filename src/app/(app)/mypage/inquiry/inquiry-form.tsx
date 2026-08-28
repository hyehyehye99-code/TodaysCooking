"use client";

import { useActionState, useState } from "react";
import { submitInquiry } from "@/lib/actions/inquiries";
import { GlassCard } from "@/components/ui";

export function InquiryForm() {
  const [state, formAction, pending] = useActionState(submitInquiry, null);
  const [message, setMessage] = useState("");

  if (state && "success" in state) {
    return (
      <div className="flex h-[40dvh] flex-col items-center justify-center text-center">
        <span className="text-[40px] leading-none">📮</span>
        <p className="mt-4 text-lg font-bold">문의를 접수했어요!</p>
        <p className="mt-2 text-sm text-ink-soft">확인 후 답변 드릴게요.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <GlassCard className="bg-white p-4">
        <p className="mb-1 text-[13px] font-bold">문의 내용</p>
        <p className="mb-3 text-xs text-ink-soft">불편했던 점이나 궁금한 점을 편하게 남겨주세요.</p>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          placeholder="예) 레시피 사진이 업로드가 안 돼요."
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
      </GlassCard>

      {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !message.trim()}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "보내는 중..." : "문의 보내기"}
      </button>
    </form>
  );
}
