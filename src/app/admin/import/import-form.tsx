"use client";

import { useRef, useState, useTransition } from "react";
import { importCreatorRecipesFromExcel } from "@/lib/actions/admin";

type ImportResult =
  | { error: string }
  | { ok: true; creatorsCreated: number; recipesCreated: number; errors: string[] };

export function ImportForm() {
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await importCreatorRecipesFromExcel(formData);
      setResult(res);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <label className="mb-1 block text-xs font-bold text-ink-soft">엑셀 파일 (.xlsx)</label>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        disabled={pending}
        className="w-full text-sm disabled:opacity-60"
      />
      {fileName && <p className="mt-2 text-xs text-ink-faint">{fileName}</p>}
      {pending && <p className="mt-3 text-xs font-semibold text-accent-ink">가져오는 중...</p>}

      {result && "error" in result && (
        <p className="mt-3 text-sm text-warn-ink">{result.error}</p>
      )}

      {result && "ok" in result && (
        <div className="mt-3 rounded-xl bg-positive/10 p-3">
          <p className="text-sm font-bold text-positive-ink">
            크리에이터 {result.creatorsCreated}명 생성, 레시피 {result.recipesCreated}개 추가했어요.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-warn-ink">
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
