"use client";

import { useRef, useState, useTransition } from "react";
import { parseExcelForPreview, commitImportRows, type ImportPreviewRow } from "@/lib/actions/admin";
import { adminGenerateRecipeFromLink } from "@/lib/actions/ai-recipe";

type CommitResult = { ok: true; creatorsCreated: number; recipesCreated: number; errors: string[] };

function rowStatus(row: ImportPreviewRow): "invalid" | "creator-only" | "needs-ai" | "ready" {
  if (!row.creatorName.trim()) return "invalid";
  if (!row.title.trim() && !row.link.trim()) return "creator-only";
  if (row.link.trim() && (!row.title.trim() || !row.ingredients.trim() || !row.notes.trim())) return "needs-ai";
  if (!row.title.trim()) return "invalid";
  return "ready";
}

const STATUS_LABEL: Record<ReturnType<typeof rowStatus>, string> = {
  invalid: "제목/링크 필요",
  "creator-only": "크리에이터만 등록",
  "needs-ai": "AI 필요",
  ready: "완성",
};
const STATUS_CLASS: Record<ReturnType<typeof rowStatus>, string> = {
  invalid: "bg-warn/10 text-warn-ink",
  "creator-only": "bg-surface text-ink-soft",
  "needs-ai": "bg-accent/10 text-accent-ink",
  ready: "bg-positive/10 text-positive-ink",
};

function formatIngredients(ingredients: { name: string; amount: string }[]) {
  return ingredients.map((i) => (i.amount ? `${i.name}:${i.amount}` : i.name)).join("\n");
}

export function ImportForm() {
  const [parsing, startParsing] = useTransition();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportPreviewRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ done: number; total: number } | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [committing, startCommitting] = useTransition();
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setRows(null);
    setParseError(null);
    setCommitResult(null);
    setCommitError(null);
    setRowErrors({});
    const formData = new FormData();
    formData.append("file", file);
    startParsing(async () => {
      const res = await parseExcelForPreview(formData);
      if ("error" in res) {
        setParseError(res.error);
        return;
      }
      setRows(res.rows);
    });
  }

  function resetAll() {
    setRows(null);
    setFileName("");
    setParseError(null);
    setCommitResult(null);
    setCommitError(null);
    setRowErrors({});
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleAiFillAll() {
    if (!rows) return;
    const needsAiIndexes = rows.map((r, i) => ({ r, i })).filter(({ r }) => rowStatus(r) === "needs-ai");
    if (needsAiIndexes.length === 0) return;

    setAiRunning(true);
    setAiProgress({ done: 0, total: needsAiIndexes.length });
    setRowErrors((prev) => {
      const next = { ...prev };
      for (const { i } of needsAiIndexes) delete next[i];
      return next;
    });
    for (let n = 0; n < needsAiIndexes.length; n++) {
      const { i, r } = needsAiIndexes[n];
      const ai = await adminGenerateRecipeFromLink(r.link.trim());
      if (ai.ok) {
        setRows((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          const row = { ...next[i] };
          row.title = row.title.trim() || ai.title || "";
          row.subtitle = row.subtitle.trim() || ai.subtitle || "";
          row.notes = row.notes.trim() || ai.instructions;
          if (!row.ingredients.trim() && ai.ingredients.length > 0) row.ingredients = formatIngredients(ai.ingredients);
          if (!row.tags.trim() && ai.tags.length > 0) row.tags = ai.tags.join(", ");
          if (!row.coverPhotoUrl.trim() && ai.thumbnailUrl) row.coverPhotoUrl = ai.thumbnailUrl;
          next[i] = row;
          return next;
        });
      } else {
        // A transient Gemini/network hiccup happens occasionally (same
        // failure mode the single-recipe AI-fill button surfaces) — the row
        // stays "AI 필요" so re-running the button retries just this one.
        setRowErrors((prev) => ({ ...prev, [i]: ai.error }));
      }
      setAiProgress({ done: n + 1, total: needsAiIndexes.length });
    }
    setAiRunning(false);
  }

  function handleCommit() {
    if (!rows) return;
    setCommitError(null);
    startCommitting(async () => {
      const res = await commitImportRows(rows);
      if ("error" in res) {
        setCommitError(res.error);
        return;
      }
      setCommitResult(res);
    });
  }

  const needsAiCount = rows ? rows.filter((r) => rowStatus(r) === "needs-ai").length : 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <label className="mb-1 block text-xs font-bold text-ink-soft">엑셀 파일 (.xlsx)</label>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        disabled={parsing || aiRunning || committing}
        className="w-full text-sm disabled:opacity-60"
      />
      {fileName && <p className="mt-2 text-xs text-ink-faint">{fileName}</p>}
      {parsing && <p className="mt-3 text-xs font-semibold text-accent-ink">읽는 중...</p>}
      {parseError && <p className="mt-3 text-sm text-warn-ink">{parseError}</p>}

      {rows && !commitResult && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-ink-soft">{rows.length}행을 읽었어요.</p>
            <button
              type="button"
              onClick={handleAiFillAll}
              disabled={aiRunning || needsAiCount === 0 || committing}
              className="rounded-lg border border-accent bg-white px-3 py-2 text-xs font-bold text-accent-ink disabled:opacity-60"
            >
              {aiRunning
                ? `AI 생성 중... (${aiProgress?.done ?? 0}/${aiProgress?.total ?? 0})`
                : needsAiCount > 0
                  ? `AI로 일괄 생성 (${needsAiCount}행)`
                  : "AI로 채울 행 없음"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-ink-soft">
                  <th className="px-3 py-2 font-semibold">크리에이터</th>
                  <th className="px-3 py-2 font-semibold">제목</th>
                  <th className="px-3 py-2 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const status = rowStatus(r);
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{r.creatorName || "-"}</td>
                      <td className="max-w-[220px] truncate px-3 py-2">{r.title || r.link || "-"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        {rowErrors[i] && (
                          <p className="mt-1 text-[11px] text-warn-ink">
                            AI 생성 실패: {rowErrors[i]} (다시 시도해보세요)
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {commitError && <p className="mt-3 text-sm text-warn-ink">{commitError}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCommit}
              disabled={aiRunning || committing}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {committing ? "등록하는 중..." : "이대로 등록하기"}
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={aiRunning || committing}
              className="rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft disabled:opacity-60"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {commitResult && (
        <div className="mt-4 rounded-xl bg-positive/10 p-3">
          <p className="text-sm font-bold text-positive-ink">
            크리에이터 {commitResult.creatorsCreated}명 생성, 레시피 {commitResult.recipesCreated}개 추가했어요.
          </p>
          {commitResult.errors.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {commitResult.errors.map((e, i) => (
                <li key={i} className="text-xs text-warn-ink">
                  {e}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={resetAll}
            className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink-soft"
          >
            다른 파일 올리기
          </button>
        </div>
      )}
    </div>
  );
}
