import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { ApplicationActions } from "./application-actions";

type Application = {
  id: string;
  applicant_user_id: string;
  creator_name: string;
  channel_type: string | null;
  channel_name: string | null;
  channel_link: string | null;
  tags: string[];
  representative_links: string[];
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거절됨",
};

type ChannelPreview = { title: string | null; thumbnailUrl: string | null; domain: string } | null;

function ApplicationCard({
  application,
  nickname,
  channelPreview,
}: {
  application: Application;
  nickname: string | null;
  channelPreview: ChannelPreview;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{application.creator_name}</p>
          <p className="text-xs text-ink-soft">
            {nickname ?? "알 수 없는 사용자"} · {new Date(application.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            application.status === "pending"
              ? "bg-accent/10 text-accent-ink"
              : application.status === "approved"
                ? "bg-positive/10 text-positive-ink"
                : "bg-surface text-ink-faint"
          }`}
        >
          {STATUS_LABEL[application.status] ?? application.status}
        </span>
      </div>

      <p className="text-xs text-ink-soft">
        {application.channel_type ?? "채널 종류 없음"}
        {application.channel_name ? ` · ${application.channel_name}` : ""}
      </p>
      {application.channel_link &&
        (channelPreview?.title || channelPreview?.thumbnailUrl ? (
          <a
            href={application.channel_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2.5 rounded-xl bg-surface p-2"
          >
            {channelPreview.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channelPreview.thumbnailUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-lg bg-border" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{channelPreview.title ?? application.channel_link}</p>
              <p className="truncate text-[11px] text-ink-faint">{channelPreview.domain}</p>
            </div>
          </a>
        ) : (
          <a
            href={application.channel_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-bold text-accent-ink underline"
          >
            채널 보기
          </a>
        ))}

      {application.tags.length > 0 && (
        <p className="mt-2 text-[11px] font-semibold text-positive-ink">
          {application.tags.map((t) => `#${t}`).join(" ")}
        </p>
      )}

      {application.representative_links.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-xs font-bold text-ink-soft">대표 레시피 링크</p>
          {application.representative_links.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-accent-ink underline"
            >
              {link}
            </a>
          ))}
        </div>
      )}

      {application.status === "pending" && (
        <div className="mt-3">
          <ApplicationActions applicationId={application.id} />
        </div>
      )}
    </div>
  );
}

export default async function AdminApplicationsPage() {
  const supabase = createAdminClient();
  const [{ data: applications }, { data: profiles }] = await Promise.all([
    supabase.from("creator_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const list = (applications as Application[] | null) ?? [];
  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );

  // Best-effort — a failed/slow fetch for one applicant's link just falls
  // back to the plain "채널 보기" text link in the card, never blocks the page.
  const previewEntries = await Promise.all(
    list.map(async (a): Promise<[string, ChannelPreview]> => {
      if (!a.channel_link) return [a.id, null];
      const preview = await fetchLinkPreview(a.channel_link);
      return [a.id, preview.ok ? { title: preview.title, thumbnailUrl: preview.thumbnailUrl, domain: preview.domain } : null];
    })
  );
  const previewById = new Map(previewEntries);

  const pending = list.filter((a) => a.status === "pending");
  const others = list.filter((a) => a.status !== "pending");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">크리에이터 신청 관리</h1>
        <a
          href="/admin/applications/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>

      <p className="mb-2 text-sm font-bold">대기중 ({pending.length})</p>
      {pending.length === 0 ? (
        <p className="mb-8 text-sm text-ink-soft">대기중인 지원서가 없어요.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {pending.map((a) => (
            <ApplicationCard key={a.id} application={a} nickname={nicknameById.get(a.applicant_user_id) ?? null} channelPreview={previewById.get(a.id) ?? null} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <>
          <p className="mb-2 text-sm font-bold">처리됨 ({others.length})</p>
          <div className="flex flex-col gap-3">
            {others.map((a) => (
              <ApplicationCard key={a.id} application={a} nickname={nicknameById.get(a.applicant_user_id) ?? null} channelPreview={previewById.get(a.id) ?? null} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
