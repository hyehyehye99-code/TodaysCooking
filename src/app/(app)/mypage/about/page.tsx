import Link from "next/link";
import { BackButton, GlassCard } from "@/components/ui";
import { getDictionary } from "@/lib/i18n/server";

const FEATURE_EMOJIS = ["✨", "🧊", "🔄", "👨‍👩‍👧", "🔔"];

export default async function AboutPage() {
  const { dict } = await getDictionary();
  const features = dict.mypage.aboutFeatures.map((f, i) => ({ ...f, emoji: FEATURE_EMOJIS[i] }));

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">{dict.mypage.about}</h1>
      </div>

      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={64} height={64} className="mb-4" />
        <h2 className="mb-2 text-lg font-bold leading-snug text-ink">
          {dict.mypage.aboutHeadlineLine1}
          <br />
          {dict.mypage.aboutHeadlineLine2}
        </h2>
        <p className="text-xs text-ink-soft">{dict.mypage.aboutSubtitle}</p>
      </div>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">{dict.mypage.aboutWhyHeading}</p>
      <GlassCard className="mb-8 bg-white p-4">
        <p className="text-sm leading-relaxed text-ink">{dict.mypage.aboutWhyBody}</p>
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">{dict.mypage.aboutFeaturesHeading}</p>
      <div className="mb-8 flex flex-col gap-2.5">
        {features.map((f) => (
          <GlassCard key={f.title} className="flex items-start gap-3 bg-white p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-base">
              {f.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{f.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{f.description}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <Link
        href="/recipes"
        className="mb-4 block w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-white"
      >
        {dict.mypage.aboutBackToApp}
      </Link>
    </div>
  );
}
