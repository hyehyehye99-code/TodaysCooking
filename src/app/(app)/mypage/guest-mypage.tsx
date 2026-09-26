import Link from "next/link";
import { GlassCard, PageHeader } from "@/components/ui";
import { Mascot } from "@/components/Mascot";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// mypage for a visitor who isn't logged in: no households, AI usage or invites
// to show — just the way in, plus what works without an account.
export function GuestMyPage({ dict }: { dict: Dictionary }) {
  const rows = [
    { href: "/", label: dict.mypage.about },
    { href: "/terms", label: dict.mypage.terms },
    { href: "/privacy", label: dict.mypage.privacy },
  ];

  return (
    <div>
      <PageHeader title={dict.mypage.title} />

      <GlassCard className="mb-8 flex flex-col items-center bg-white p-5 text-center">
        <Mascot name="main" size={120} />
        <p className="mt-3 text-base font-bold text-ink">{dict.guest.mypageTitle}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{dict.guest.mypageDesc}</p>
        <p className="mt-1 text-xs text-ink-faint">{dict.guest.syncNote}</p>
        <Link href="/login" className="mt-4 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white">
          {dict.guest.loginButton}
        </Link>
        <p className="mt-3 text-[13px] text-ink-faint">{dict.guest.localNotice}</p>
      </GlassCard>

      <Link
        href="/mypage/fridge"
        className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
          <Mascot name="fridge-open" size={30} />
        </span>
        <span className="flex-1 text-sm font-bold text-ink">{dict.mypage.fridge}</span>
        <Chevron />
      </Link>

      <GlassCard className="bg-white">
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
            >
              {row.label}
              <Chevron />
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
