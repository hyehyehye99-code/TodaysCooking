import { createAdminClient } from "@/lib/supabase/admin";
import { InquiryActions, ReopenButton } from "./inquiry-actions";

type Inquiry = {
  id: string;
  user_id: string;
  message: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

function InquiryCard({ inquiry, nickname }: { inquiry: Inquiry; nickname: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-ink-soft">{nickname ?? "알 수 없는 사용자"}</p>
        <span className="text-xs text-ink-faint">{new Date(inquiry.created_at).toLocaleString("ko-KR")}</span>
      </div>
      <p className="whitespace-pre-line text-sm text-ink">{inquiry.message}</p>

      {inquiry.status === "open" ? (
        <InquiryActions inquiryId={inquiry.id} />
      ) : (
        <div className="mt-3 rounded-xl bg-surface p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-bold text-ink-soft">답변</p>
            <ReopenButton inquiryId={inquiry.id} />
          </div>
          <p className="whitespace-pre-line text-sm text-ink">{inquiry.admin_note || "(답변 없이 처리됨)"}</p>
        </div>
      )}
    </div>
  );
}

export default async function AdminInquiriesPage() {
  const supabase = createAdminClient();
  const [{ data: inquiries }, { data: profiles }] = await Promise.all([
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const list = (inquiries as Inquiry[] | null) ?? [];
  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );

  const open = list.filter((q) => q.status === "open");
  const resolved = list.filter((q) => q.status !== "open");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">문의 관리</h1>
        <a
          href="/admin/inquiries/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>

      <p className="mb-2 text-sm font-bold">확인중 ({open.length})</p>
      {open.length === 0 ? (
        <p className="mb-8 text-sm text-ink-soft">확인 대기중인 문의가 없어요.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {open.map((q) => (
            <InquiryCard key={q.id} inquiry={q} nickname={nicknameById.get(q.user_id) ?? null} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <p className="mb-2 text-sm font-bold">처리됨 ({resolved.length})</p>
          <div className="flex flex-col gap-3">
            {resolved.map((q) => (
              <InquiryCard key={q.id} inquiry={q} nickname={nicknameById.get(q.user_id) ?? null} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
