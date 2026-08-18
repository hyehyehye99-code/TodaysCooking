"use client";

import Link from "next/link";
import { TabBar } from "@/components/TabBar";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-accent/8 px-3.5 py-2.5">
          <span className="text-xs font-bold text-accent-ink">게스트로 둘러보는 중</span>
          <Link href="/login" className="text-xs font-bold text-accent">
            로그인하기
          </Link>
        </div>
        {children}
      </div>
      <TabBar basePath="/guest" />
    </div>
  );
}
