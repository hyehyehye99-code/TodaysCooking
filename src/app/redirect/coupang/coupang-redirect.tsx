"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getCoupangSearchLink } from "@/lib/actions/coupang";

export function CoupangRedirect() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "";

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    getCoupangSearchLink(name).then(({ url }) => {
      if (!cancelled) window.location.replace(url);
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col items-center justify-center px-7 text-center">
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={72} height={72} />
        <p className="text-sm font-bold text-ink">쿠팡으로 이동중이에요~</p>
        <p className="rounded-xl bg-surface px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
          쿠팡파트너스 활동의 일환으로 &quot;구매하기&quot; 버튼을 클릭하면 이에 따른 일정 금액의
          수수료를 제공받습니다.
        </p>
        <div className="mt-2 h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    </div>
  );
}
