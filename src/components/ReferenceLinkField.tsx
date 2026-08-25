"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { generateRecipeFromLink, reportAiRecipeResult } from "@/lib/actions/ai-recipe";
import { ClearableInput } from "@/components/ClearableInput";
import { useClipboardLinkSuggestion } from "@/lib/useClipboardLinkSuggestion";
import { Modal } from "@/components/Modal";

type Preview = { title: string | null; thumbnailUrl: string | null; domain: string | null };
type AiResult = { title: string | null; ingredients: string[]; instructions: string; tags: string[] };

const DEBOUNCE_MS = 700;

function AiInfoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="AI 자동 작성 안내"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink-faint text-[10px] font-bold text-ink-faint"
      >
        i
      </button>
      <Modal open={open} onClose={() => setOpen(false)} variant="center">
        <div className="mx-auto w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">AI 자동 작성 안내</p>
          <ul className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-ink-soft">
            <li>· 무료로는 일주일에 5번까지 쓸 수 있어요.</li>
            <li>· 구독하면 한 달에 100번까지 쓸 수 있어요.</li>
            <li>· 결과가 마음에 안 들면 결과 옆의 &quot;신고하기&quot;로 알려주세요 — 확인 후 사용 횟수를 돌려드릴 수 있어요.</li>
          </ul>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-xl bg-surface py-2.5 text-xs font-bold text-ink-soft"
          >
            확인
          </button>
        </div>
      </Modal>
    </>
  );
}

function ReportResultModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    setSending(true);
    await onSubmit(note);
    setSending(false);
    setNote("");
  }

  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <div className="w-full rounded-t-3xl bg-white p-5 pb-8">
        <p className="text-sm font-bold text-ink">결과가 별로였나요?</p>
        <p className="mt-1 text-xs text-ink-soft">
          어떤 점이 아쉬웠는지 알려주시면 확인 후 사용 횟수를 돌려드릴게요.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="예: 재료가 실제와 달라요 (선택)"
          className="mt-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-surface py-2.5 text-xs font-bold text-ink-soft"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending}
            className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {sending ? "보내는 중..." : "신고하기"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ReferenceLinkField({
  name,
  defaultValue = "",
  initialPreview = null,
  onAiResult,
}: {
  name: string;
  defaultValue?: string;
  initialPreview?: Preview | null;
  onAiResult?: (result: AiResult) => void;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [preview, setPreview] = useState<Preview | null>(initialPreview);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLimitReached, setAiLimitReached] = useState(false);
  // Kept only so a "결과가 별로였나요?" report can reference exactly which
  // generation to look up — cleared whenever a new AI attempt starts so a
  // report can never be filed against a stale result.
  const [lastGeneration, setLastGeneration] = useState<{ id: string; url: string; result: AiResult } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedUrlRef = useRef<string>(defaultValue);
  const { suggestion, dismiss } = useClipboardLinkSuggestion(defaultValue);

  function useSuggestion() {
    if (!suggestion) return;
    setUrl(suggestion);
    load(suggestion);
    dismiss();
  }

  function load(value: string) {
    const trimmed = value.trim();
    requestedUrlRef.current = trimmed;
    if (!trimmed) {
      setPreview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchLinkPreview(trimmed).then((result) => {
      if (requestedUrlRef.current !== trimmed) return; // a newer request superseded this one
      setLoading(false);
      if (result.ok && (result.title || result.thumbnailUrl)) {
        setPreview({ title: result.title, thumbnailUrl: result.thumbnailUrl, domain: result.domain });
      } else {
        setPreview(null);
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUrl(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => load(value), DEBOUNCE_MS);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    load(url);
  }

  async function handleAiFill() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAiLoading(true);
    setAiError(null);
    setAiLimitReached(false);
    setLastGeneration(null);
    setReportSent(false);
    const result = await generateRecipeFromLink(trimmed);
    setAiLoading(false);
    if (!result.ok) {
      setAiError(result.error);
      setAiLimitReached(!!result.limitReached);
      return;
    }
    setLastGeneration({ id: result.generationId, url: trimmed, result });
    onAiResult?.(result);
  }

  async function handleReportSubmit(note: string) {
    if (!lastGeneration) return;
    const { id, url: reportedUrl, result } = lastGeneration;
    await reportAiRecipeResult({ generationId: id, url: reportedUrl, note, ...result });
    setReportOpen(false);
    setReportSent(true);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div>
      {suggestion && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-accent/8 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
            복사한 링크가 있어요: <span className="font-semibold text-ink">{suggestion}</span>
          </span>
          <button
            type="button"
            onClick={useSuggestion}
            className="shrink-0 rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-white"
          >
            사용
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="shrink-0 text-xs text-ink-faint"
          >
            ×
          </button>
        </div>
      )}
      <ClearableInput
        name={name}
        type="url"
        value={url}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="https://..."
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
      />

      {loading && <p className="mt-2 text-xs text-ink-faint">미리보기를 불러오는 중...</p>}

      {!loading && preview && (preview.title || preview.thumbnailUrl) && (
        <div className="mt-3 flex gap-3">
          <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
            {preview.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="line-clamp-2 text-[13px] font-bold leading-snug">
              {preview.title || "참고 링크"}
            </p>
            {preview.domain && <span className="text-[11px] text-ink-faint">{preview.domain}</span>}
          </div>
        </div>
      )}

      {!loading && preview && onAiResult && (
        <>
          <div className="mt-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAiFill}
              disabled={aiLoading}
              className="flex-1 rounded-xl border border-accent bg-white py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
            >
              {aiLoading ? "AI가 작성하는 중..." : "✨ AI로 재료·레시피 자동 작성"}
            </button>
            <AiInfoButton />
          </div>
          {aiError && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-warn-ink">{aiError}</p>
              {aiLimitReached && (
                <Link href="/mypage/subscription" className="shrink-0 text-xs font-bold text-accent-ink underline">
                  구독하기
                </Link>
              )}
            </div>
          )}
          {lastGeneration && !reportSent && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-2 text-[11px] text-ink-faint underline"
            >
              결과가 별로였나요? 신고하기
            </button>
          )}
          {reportSent && <p className="mt-2 text-[11px] text-ink-faint">신고가 접수됐어요. 확인해볼게요.</p>}
          <ReportResultModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReportSubmit} />
        </>
      )}
    </div>
  );
}
