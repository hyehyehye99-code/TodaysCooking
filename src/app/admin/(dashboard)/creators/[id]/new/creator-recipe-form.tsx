"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminGenerateRecipeFromLink } from "@/lib/actions/ai-recipe";
import { createCreatorRecipe, updateCreatorRecipe } from "@/lib/actions/admin";
import { TagPicker } from "@/components/TagPicker";
import { EmojiPicker } from "@/components/EmojiPicker";

type Ingredient = { name: string; amount: string };

const EMPTY_INGREDIENT: Ingredient = { name: "", amount: "" };

type InitialRecipe = {
  recipeId: string;
  title: string;
  subtitle: string;
  iconEmoji: string;
  coverPhotoUrl: string;
  tags: string[];
  notes: string;
  ingredients: Ingredient[];
  sourceUrl: string;
};

export function CreatorRecipeForm({
  creatorId,
  existingTags,
  initial,
  initialUrl,
}: {
  creatorId: string;
  existingTags: string[];
  initial?: InitialRecipe;
  initialUrl?: string;
}) {
  const isEdit = !!initial;
  const router = useRouter();

  const [url, setUrl] = useState(initial?.sourceUrl ?? initialUrl ?? "");
  const [aiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [iconEmoji, setIconEmoji] = useState(initial?.iconEmoji ?? "");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initial?.coverPhotoUrl ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients && initial.ingredients.length > 0 ? initial.ingredients : [EMPTY_INGREDIENT]
  );
  // Bumping this remounts TagPicker so its internal selection picks up a new
  // defaultSelected after AI fill — TagPicker has no controlled `value` prop.
  const [tagPickerKey, setTagPickerKey] = useState(0);

  const [savePending, startSaveTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  function resetForm() {
    setUrl("");
    setTitle("");
    setSubtitle("");
    setIconEmoji("");
    setCoverPhotoUrl("");
    setNotes("");
    setTags([]);
    setIngredients([EMPTY_INGREDIENT]);
    setTagPickerKey((k) => k + 1);
  }

  function handleAiFill() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAiError(null);
    startAiTransition(async () => {
      const result = await adminGenerateRecipeFromLink(trimmed);
      if (!result.ok) {
        setAiError(result.error);
        return;
      }
      if (result.title) setTitle(result.title);
      if (result.subtitle) setSubtitle(result.subtitle);
      if (result.thumbnailUrl && !coverPhotoUrl) setCoverPhotoUrl(result.thumbnailUrl);
      if (result.instructions) setNotes(result.instructions);
      if (result.ingredients.length > 0) setIngredients(result.ingredients);
      // Tags are picked by the admin, not the AI — its guesses were noisy
      // enough that leaving them out and picking manually was preferred.
    });
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSave() {
    setSaveError(null);
    startSaveTransition(async () => {
      const payload = { creatorId, title, subtitle, iconEmoji, coverPhotoUrl, tags, notes, ingredients, sourceUrl: url.trim() };
      const result = isEdit
        ? await updateCreatorRecipe({ ...payload, recipeId: initial.recipeId })
        : await createCreatorRecipe(payload);
      if ("error" in result) {
        setSaveError(result.error);
        return;
      }
      if (isEdit) {
        router.push(`/admin/creators/${creatorId}`);
        return;
      }
      setSavedCount((n) => n + 1);
      resetForm();
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      {savedCount > 0 && (
        <p className="rounded-xl bg-positive/10 px-3.5 py-2.5 text-xs font-bold text-positive-ink">
          지금까지 {savedCount}개 저장했어요. 이어서 다음 레시피를 입력해주세요.
        </p>
      )}

      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="mb-2 text-sm font-bold">참고 링크로 AI 자동 작성</p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full min-w-0 flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiPending || !url.trim()}
            className="shrink-0 rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
          >
            {aiPending ? "작성 중..." : "AI 자동 작성"}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-warn-ink">{aiError}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <label className="mb-1 block text-xs font-bold text-ink-soft">요리 이름 *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 된장찌개"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm font-bold outline-none focus:border-accent"
        />
        <label className="mb-1 mt-3 block text-xs font-bold text-ink-soft">한 줄 소개</label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="예) 기본 중의 기본"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold text-ink-soft">재료</label>
          <button type="button" onClick={() => setIngredients((prev) => [...prev, EMPTY_INGREDIENT])} className="text-xs font-bold text-accent-ink">
            + 재료 추가
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="재료명"
                className="w-full min-w-0 flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                value={ing.amount}
                onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                placeholder="용량"
                className="w-24 shrink-0 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  aria-label="삭제"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface text-ink-faint"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <label className="mb-1 block text-xs font-bold text-ink-soft">만드는 법</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <label className="mb-2 block text-xs font-bold text-ink-soft">태그</label>
        <TagPicker key={tagPickerKey} name="tags" existingTags={existingTags} defaultSelected={tags} onChange={setTags} />
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <label className="mb-1 block text-xs font-bold text-ink-soft">커버 사진 URL</label>
        <input
          value={coverPhotoUrl}
          onChange={(e) => setCoverPhotoUrl(e.target.value)}
          placeholder="https://..."
          className="mb-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <label className="mb-1.5 block text-xs font-bold text-ink-soft">아이콘 이모지 (사진 없을 때 표시)</label>
        <EmojiPicker name="iconEmoji" defaultValue={iconEmoji} onChange={setIconEmoji} />
      </div>

      {saveError && <p className="text-sm text-warn-ink">{saveError}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={savePending || !title.trim()}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {savePending ? "저장하는 중..." : isEdit ? "수정 저장" : "레시피 저장"}
      </button>
    </div>
  );
}
