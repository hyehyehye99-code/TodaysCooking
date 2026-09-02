"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCollection, updateCollection, deleteCollection } from "@/lib/actions/explore-collections";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Collection } from "./page";

function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => { void updateCollection(id, { active: !active }); })}
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
      await deleteCollection(id);
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
        title={`"${title}" 컬렉션을 삭제할까요?`}
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

function NewCollectionForm() {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createCollection(title, emoji.trim() || null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setTitle("");
      setEmoji("");
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-white p-4">
      <p className="mb-3 text-sm font-bold">새 컬렉션 만들기</p>
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🦐"
          maxLength={4}
          className="w-16 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-center text-sm outline-none focus:border-accent"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (예: 새우 요리 모음)"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !title.trim()}
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "만드는 중..." : "만들기"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

export function CollectionList({
  collections,
  recipeCountById,
}: {
  collections: Collection[];
  recipeCountById: Record<string, number>;
}) {
  return (
    <div>
      <NewCollectionForm />
      {collections.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 만든 컬렉션이 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="px-3 py-2 font-semibold">컬렉션</th>
                <th className="px-3 py-2 text-right font-semibold">레시피 수</th>
                <th className="px-3 py-2 font-semibold">상태</th>
                <th className="w-32 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 font-bold">
                    {c.emoji ? `${c.emoji} ` : ""}
                    {c.title}
                  </td>
                  <td className="px-3 py-2 text-right text-ink-soft">{recipeCountById[c.id] ?? 0}</td>
                  <td className="px-3 py-2">
                    <ActiveToggle id={c.id} active={c.active} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/collections/${c.id}`} className="text-xs font-bold text-accent-ink">
                        레시피 관리
                      </Link>
                      <DeleteButton id={c.id} title={c.title} />
                    </div>
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
