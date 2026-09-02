"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { generateRecipeFromLink, reportAiRecipeResult } from "@/lib/actions/ai-recipe";
import { ClearableInput } from "@/components/ClearableInput";
import { useClipboardLinkSuggestion } from "@/lib/useClipboardLinkSuggestion";
import { Modal } from "@/components/Modal";
import { useDict } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

type Preview = { title: string | null; thumbnailUrl: string | null; domain: string | null };
type AiResult = { title: string | null; ingredients: string[]; instructions: string; tags: string[] };

const DEBOUNCE_MS = 700;

const AI_SUPPORTED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "instagram.com",
  "www.instagram.com",
]);

// AI extraction leans on the post's description (see generateRecipeFromLink)
// — YouTube gets its description via the Data API, and Instagram reels
// reliably carry the full caption in their og:description, so both are
// worth offering the button for. Any other link only has a plain OG title,
// unreliable enough that it's better to not offer the button than to burn
// someone's limited weekly quota on a guess.
function isAiSupportedUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return AI_SUPPORTED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function AiInfoButton({ dict }: { dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.components.aiInfoTitle}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink-faint text-[10px] font-bold text-ink-faint"
      >
        i
      </button>
      <Modal open={open} onClose={() => setOpen(false)} variant="center">
        <div className="mx-auto w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">{dict.components.aiInfoTitle}</p>
          <ul className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-ink-soft">
            <li>{dict.components.aiInfoItem1}</li>
            <li>{dict.components.aiInfoItem2}</li>
            <li>{dict.components.aiInfoItem3}</li>
            <li>{dict.components.aiInfoItem4}</li>
          </ul>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-xl bg-surface py-2.5 text-xs font-bold text-ink-soft"
          >
            {dict.common.confirm}
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
  dict,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
  dict: Dictionary;
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
        <p className="text-sm font-bold text-ink">{dict.components.reportTitle}</p>
        <p className="mt-1 text-xs text-ink-soft">{dict.components.reportDescription}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={dict.components.reportPlaceholder}
          className="mt-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-surface py-2.5 text-xs font-bold text-ink-soft"
          >
            {dict.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending}
            className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {sending ? dict.components.reportSending : dict.components.reportSubmit}
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
  const dict = useDict();
  const [url, setUrl] = useState(defaultValue);
  const [preview, setPreview] = useState<Preview | null>(initialPreview);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
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
    setLastGeneration(null);
    setReportSent(false);
    const result = await generateRecipeFromLink(trimmed);
    setAiLoading(false);
    if (!result.ok) {
      setAiError(result.error);
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
        name={name}
        type="url"
        value={url}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="https://..."
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
      />

      {loading && <p className="mt-2 text-xs text-ink-faint">{dict.components.previewLoading}</p>}

      {!loading && preview && (preview.title || preview.thumbnailUrl) && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft">{dict.welcome.referenceLink}</span>
            {onAiResult && <AiInfoButton dict={dict} />}
          </div>
          <div className="flex gap-3">
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
                {preview.title || dict.welcome.referenceLink}
              </p>
              {preview.domain && <span className="text-[11px] text-ink-faint">{preview.domain}</span>}
            </div>
          </div>
        </div>
      )}

      {!loading && preview && onAiResult && (
        <>
          {isAiSupportedUrl(url) ? (
            <button
              type="button"
              onClick={handleAiFill}
              disabled={aiLoading}
              className="mt-3 w-full rounded-xl border border-accent bg-white py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
            >
              {aiLoading ? dict.welcome.aiFillLoading : dict.welcome.aiFillButton}
            </button>
          ) : (
            <p className="mt-3 text-center text-[11px] text-ink-faint">{dict.components.aiYoutubeOnly}</p>
          )}
          {aiError && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-warn-ink">{aiError}</p>
            </div>
          )}
          {lastGeneration && !reportSent && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="text-[11px] text-ink-faint underline"
              >
                {dict.components.reportPrompt}
              </button>
            </div>
          )}
          {reportSent && <p className="mt-2 text-right text-[11px] text-ink-faint">{dict.components.reportReceived}</p>}
          <ReportResultModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            onSubmit={handleReportSubmit}
            dict={dict}
          />
        </>
      )}
    </div>
  );
}
