import Link from "next/link";

export function AppHeader({ currentName }: { currentName: string }) {
  return (
    <Link href="/mypage" className="mb-5 flex items-center gap-1 text-sm font-bold text-ink-soft">
      {currentName}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
