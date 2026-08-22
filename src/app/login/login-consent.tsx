"use client";

import { useState } from "react";
import Link from "next/link";

export function LoginConsentGate({ children }: { children: React.ReactNode }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div>
      <label className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        />
        <span>
          <Link href="/terms" target="_blank" className="font-bold text-ink underline">
            이용약관
          </Link>{" "}
          및{" "}
          <Link href="/privacy" target="_blank" className="font-bold text-ink underline">
            개인정보처리방침
          </Link>
          에 동의합니다
        </span>
      </label>
      <div className={agreed ? "" : "pointer-events-none opacity-50"} aria-disabled={!agreed}>
        {children}
      </div>
    </div>
  );
}
