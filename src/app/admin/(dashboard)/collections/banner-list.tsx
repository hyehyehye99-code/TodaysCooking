"use client";

import { useState, useTransition } from "react";
import { createBanner, updateBanner, deleteBanner } from "@/lib/actions/explore-collections";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Banner } from "./page";

function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => { void updateBanner(id, { active: !active }); })}
      disabled={pending}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold disabled:opacity-60 ${
        active ? "bg-positive/10 text-positive-ink" : "bg-surface text-ink-faint"
      }`}
    >
      {active ? "노출중" : "숨김"}
    </button>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteBanner(id);
      setOpen(false);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-warn-ink">
        삭제
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title={`"${title}" 배너를 삭제할까요?`}
        confirmSlot={
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "삭제하는 중..." : "삭제"}
          </button>
        }
      />
    </>
  );
}

function NewBannerForm() {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createBanner(title, emoji.trim() || null, linkUrl.trim() || null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setTitle("");
      setEmoji("");
      setLinkUrl("");
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-white p-4">
      <p className="mb-3 text-sm font-bold">새 배너 만들기</p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🎄"
            maxLength={4}
            className="w-16 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-center text-sm outline-none focus:border-accent"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문구 (예: 크리스마스 특집 보러가기)"
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="연결 링크 (선택, 예: /explore/collection/...)"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !title.trim()}
          className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "만드는 중..." : "만들기"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

export function BannerList({ banners }: { banners: Banner[] }) {
  return (
    <div>
      <NewBannerForm />
      {banners.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 만든 배너가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="px-3 py-2 font-semibold">배너</th>
                <th className="px-3 py-2 font-semibold">링크</th>
                <th className="px-3 py-2 font-semibold">상태</th>
                <th className="w-16 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 font-bold">
                    {b.emoji ? `${b.emoji} ` : ""}
                    {b.title}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-ink-soft">{b.link_url ?? "-"}</td>
                  <td className="px-3 py-2">
                    <ActiveToggle id={b.id} active={b.active} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DeleteButton id={b.id} title={b.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
