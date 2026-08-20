"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setHouseholdSharing, setHouseholdShareTags } from "@/lib/actions/sharing";
import { Modal } from "@/components/Modal";
import { RecipeThumb } from "@/components/RecipeThumb";

type ShareChangeLog = {
  nickname: string;
  action: "enabled" | "disabled" | "tags_changed";
  at: string;
} | null;

type SharedPreviewRecipe = {
  id: string;
  title: string;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  likeCount: number;
};

const ACTION_LABELS: Record<NonNullable<ShareChangeLog>["action"], string> = {
  enabled: "공유를 켰어요",
  disabled: "공유를 껐어요",
  tags_changed: "공개 범위를 바꿨어요",
};

// Safe to compute plainly at render time (no SSR/client mismatch risk): this
// only ever renders inside <Modal>, which itself renders null until opened,
// so there's no server-rendered HTML for this text to disagree with.
function relativeTimeFrom(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / (60 * 24))}일 전`;
}

export function ShareMenuButton({
  householdId,
  householdName,
  initialShareCode,
  initialShareTags,
  shareableTags,
  changeLog,
  sharedPreview,
}: {
  householdId: string;
  householdName: string;
  initialShareCode: string | null;
  initialShareTags: string[];
  shareableTags: string[];
  changeLog: ShareChangeLog;
  sharedPreview: SharedPreviewRecipe[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shareCode, setShareCode] = useState(initialShareCode);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialShareTags);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tagsPending, startTagsTransition] = useTransition();

  const shareUrl = shareCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareCode}`
    : "";

  function toggleSharing(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setHouseholdSharing(householdId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Turning sharing on always starts from an off state, so there's no
      // previous tag filter to carry over.
      if (next) setSelectedTags([]);
      setShareCode(result.shareCode);
      router.refresh(); // re-fetch the preview list below to match
    });
  }

  function toggleTag(tag: string) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(next);
    startTagsTransition(async () => {
      const result = await setHouseholdShareTags(householdId, next);
      if (!result.ok) setError(result.error);
      else router.refresh(); // re-fetch the preview list below to match
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-surface px-3 py-2 text-xs font-bold text-ink-soft"
      >
        메뉴판 공유
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
          <p className="mb-1 text-[15px] font-bold">{householdName} 메뉴판 공유하기</p>
          <p className={changeLog ? "mb-1.5 text-xs text-ink-soft" : "mb-4 text-xs text-ink-soft"}>
            누구나 로그인 없이 메뉴를 볼 수 있고, 로그인하면 하트로 반응을 남길 수 있어요.
          </p>
          {changeLog && (
            <p className="mb-4 text-[11px] text-ink-faint">
              {changeLog.nickname}님이 {ACTION_LABELS[changeLog.action]} ·{" "}
              {relativeTimeFrom(changeLog.at)}
            </p>
          )}

          {shareCode ? (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className={`flex-1 rounded-xl border py-3.5 text-sm font-bold ${
                    copied
                      ? "border-accent bg-white text-accent-ink"
                      : "border-transparent bg-accent text-white"
                  }`}
                >
                  {copied ? "링크를 복사했어요!" : "공유 링크 복사하기"}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center justify-center rounded-xl bg-surface px-4 text-sm font-bold text-ink-soft"
                >
                  미리보기
                </a>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-bold text-ink-soft">공유 중인 메뉴</p>
                {sharedPreview.length === 0 ? (
                  <p className="text-[11px] text-ink-faint">공개된 메뉴가 없어요.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {sharedPreview.map((recipe) => (
                      <div key={recipe.id} className="flex items-center gap-2.5">
                        <RecipeThumb
                          coverPhotoUrl={recipe.cover_photo_urls[0]}
                          iconEmoji={recipe.icon_emoji}
                          size={36}
                        />
                        <p className="min-w-0 flex-1 truncate text-xs font-semibold">{recipe.title}</p>
                        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-ink-faint">
                          <svg
                            viewBox="0 0 24 24"
                            width="13"
                            height="13"
                            fill={recipe.likeCount > 0 ? "var(--color-warn)" : "none"}
                            stroke={recipe.likeCount > 0 ? "var(--color-warn)" : "var(--color-ink-faint)"}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          {recipe.likeCount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-bold text-ink-soft">공개 범위</p>
                <p className="mb-2.5 text-[11px] text-ink-faint">
                  {selectedTags.length === 0
                    ? "전체 메뉴가 공개돼요. 태그를 고르면 그 태그가 붙은 메뉴만 보여요."
                    : "선택한 태그가 붙은 메뉴만 공개돼요."}
                </p>
                {shareableTags.length === 0 ? (
                  <p className="text-[11px] text-ink-faint">아직 태그가 붙은 메뉴가 없어요.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {shareableTags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          disabled={tagsPending}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                            active ? "bg-accent text-white" : "bg-surface text-ink-soft"
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-bold text-ink-soft">링크 관리</p>
                <button
                  type="button"
                  onClick={() => toggleSharing(false)}
                  disabled={pending}
                  className="w-full rounded-lg bg-surface py-2.5 text-xs font-bold text-warn-ink disabled:opacity-60"
                >
                  {pending ? "처리 중..." : "공유 끄기"}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => toggleSharing(true)}
              disabled={pending}
              className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending ? "만드는 중..." : "공유 링크 만들기"}
            </button>
          )}

          {error && <p className="mt-3 text-xs text-warn-ink">{error}</p>}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
          >
            닫기
          </button>
        </div>
      </Modal>
    </>
  );
}
