import { createAdminClient } from "@/lib/supabase/admin";
import { AiReportActions } from "./ai-report-actions";

type Report = {
  id: string;
  user_id: string;
  generation_id: string;
  url: string;
  generated_title: string | null;
  generated_ingredients: string[];
  generated_instructions: string;
  generated_tags: string[];
  note: string | null;
  created_at: string;
};

export default async function AdminAiReportsPage() {
  const supabase = createAdminClient();
  const [{ data: reports }, { data: profiles }] = await Promise.all([
    supabase.from("ai_recipe_reports").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const list = (reports as Report[] | null) ?? [];
  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-bold">AI 기능 오류 사항 문의 관리</h1>
        <a
          href="/admin/ai-reports/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>
      <p className="mb-6 text-sm text-ink-soft">
        AI 자동 작성 결과가 별로였다고 신고된 항목이에요. 실제로 잘못됐으면 &ldquo;횟수 환불하고 삭제&rdquo;로
        신고자의 이번 주기 사용 횟수를 되돌려줄 수 있어요.
      </p>

      {list.length === 0 ? (
        <p className="text-sm text-ink-soft">신고된 항목이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-ink-soft">{nicknameById.get(r.user_id) ?? "알 수 없는 사용자"}</p>
                <span className="text-xs text-ink-faint">{new Date(r.created_at).toLocaleString("ko-KR")}</span>
              </div>

              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 inline-block truncate text-xs text-accent-ink underline"
              >
                {r.url}
              </a>

              <p className="text-sm font-bold">{r.generated_title || "(제목 없음)"}</p>
              {r.generated_ingredients.length > 0 && (
                <p className="mt-1 text-xs text-ink-soft">재료: {r.generated_ingredients.join(", ")}</p>
              )}
              {r.generated_instructions && (
                <p className="mt-1 whitespace-pre-line text-xs text-ink-soft">{r.generated_instructions}</p>
              )}
              {r.generated_tags.length > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-positive-ink">
                  {r.generated_tags.map((t) => `#${t}`).join(" ")}
                </p>
              )}

              {r.note && (
                <div className="mt-2 rounded-xl bg-surface p-3">
                  <p className="mb-1 text-xs font-bold text-ink-soft">신고 사유</p>
                  <p className="whitespace-pre-line text-sm text-ink">{r.note}</p>
                </div>
              )}

              <AiReportActions reportId={r.id} generationId={r.generation_id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
