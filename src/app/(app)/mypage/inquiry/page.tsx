import { getMyInquiries } from "@/lib/actions/inquiries";
import { SubPageHeader } from "@/components/ui";
import { getCurrentHousehold } from "@/lib/household";
import { LoginPrompt } from "@/components/LoginPrompt";
import { InquiryForm } from "./inquiry-form";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function InquiryPage() {
  const { user } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="account" />;
  const inquiries = await getMyInquiries();

  return (
    <div>
      <SubPageHeader href="/mypage" title="문의하기" />

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
                    className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${
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
