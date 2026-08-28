import { getDictionary } from "@/lib/i18n/server";

export default async function ExplorePage() {
  const { dict } = await getDictionary();

  return (
    <div className="flex h-[60dvh] flex-col items-center justify-center text-center">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M20.5 20.5l-5-5" />
      </svg>
      <p className="mt-4 text-lg font-bold">{dict.explore.comingSoonTitle}</p>
      <p className="mt-2 text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
    </div>
  );
}
