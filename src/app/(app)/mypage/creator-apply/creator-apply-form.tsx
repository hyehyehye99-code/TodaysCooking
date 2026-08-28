"use client";

import { useActionState, useState } from "react";
import { submitCreatorApplication } from "@/lib/actions/creator-application";
import { GlassCard } from "@/components/ui";
import { TagPicker } from "@/components/TagPicker";
import { FieldLabel } from "@/components/FieldLabel";
import { ClearableInput } from "@/components/ClearableInput";
import { StickyFormBar } from "@/components/StickyFormBar";

const CHANNEL_TYPES = ["유튜브", "블로그", "인스타그램", "기타"];

export function CreatorApplyForm() {
  const [state, formAction, pending] = useActionState(submitCreatorApplication, undefined);
  const [links, setLinks] = useState<string[]>([""]);

  if (state && "success" in state) {
    return (
      <div className="flex h-[60dvh] flex-col items-center justify-center text-center">
        <span className="text-[40px] leading-none">🎉</span>
        <p className="mt-4 text-lg font-bold">지원서를 보냈어요!</p>
        <p className="mt-2 text-sm text-ink-soft">검토 후 등록되면 탐색 탭에서 만나볼 수 있어요.</p>
      </div>
    );
  }

  return (
    <div>
      <form
        id="creator-apply-form"
        action={formAction}
        className="flex flex-col gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      >
        <div>
          <FieldLabel required>크리에이터 이름</FieldLabel>
          <ClearableInput
            name="creatorName"
            required
            placeholder="예) 오늘의 집밥"
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-base font-bold outline-none focus:border-accent"
          />
        </div>

        <GlassCard className="bg-white p-4">
          <FieldLabel>채널 종류</FieldLabel>
          <select
            name="channelType"
            defaultValue=""
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          >
            <option value="" disabled>
              선택해주세요
            </option>
            {CHANNEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>채널 이름</FieldLabel>
              <ClearableInput
                name="channelName"
                placeholder="예) 오늘의 집밥 TV"
                className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldLabel>채널 링크</FieldLabel>
              <ClearableInput
                name="channelLink"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>태그</FieldLabel>
          <TagPicker name="tags" existingTags={[]} />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>대표 레시피 (링크)</FieldLabel>
          <p className="mb-3 text-xs text-ink-soft">소개하고 싶은 레시피 영상/게시물 링크를 추가해주세요.</p>
          <div className="flex flex-col gap-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  name="representativeLinks"
                  value={link}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = e.target.value;
                    setLinks(next);
                  }}
                  placeholder="https://..."
                  className="w-full min-w-0 flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                    aria-label="삭제"
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-surface text-ink-faint"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLinks([...links, ""])}
            className="mt-2.5 text-xs font-bold text-accent-ink"
          >
            + 링크 추가
          </button>
        </GlassCard>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}
      </form>

      <StickyFormBar
        formId="creator-apply-form"
        pending={pending}
        label="지원서 보내기"
        pendingLabel="보내는 중..."
      />
    </div>
  );
}
