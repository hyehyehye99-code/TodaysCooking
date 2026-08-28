import Link from "next/link";
import { getMyInquiries } from "@/lib/actions/inquiries";
import { InquiryForm } from "./inquiry-form";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function InquiryPage() {
  const inquiries = await getMyInquiries();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">문의하기</h1>
        <Link
          href="/mypage"
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <InquiryForm />

      {inquiries.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-sm font-bold">지난 문의</p>
          <div className="flex flex-col gap-3">
            {inquiries.map((q) => (
              <div key={q.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-faint">{formatDate(q.created_at)}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      q.status === "resolved" ? "bg-positive/10 text-positive-ink" : "bg-accent/10 text-accent-ink"
                    }`}
                  >
                    {q.status === "resolved" ? "답변 완료" : "확인중"}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm text-ink">{q.message}</p>
                {q.admin_note && (
                  <div className="mt-3 rounded-xl bg-surface p-3">
                    <p className="mb-1 text-xs font-bold text-ink-soft">답변</p>
                    <p className="whitespace-pre-line text-sm text-ink">{q.admin_note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
