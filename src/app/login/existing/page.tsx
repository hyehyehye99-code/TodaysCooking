"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithPassword } from "@/lib/actions/auth";

export default function ExistingLoginPage() {
  const [state, formAction, pending] = useActionState(signInWithPassword, undefined);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col justify-center px-6">
      <Link href="/login/start" className="mb-6 text-sm text-ink-soft">
        ← 뒤로
      </Link>
      <p className="mb-1 text-xs font-bold tracking-wide text-ink-faint">오내요</p>
      <h1 className="mb-2 text-[28px] font-bold leading-tight">다시 만나서 반가워요</h1>
      <p className="mb-8 text-sm text-ink-soft">아이디와 비밀번호를 입력해주세요.</p>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="username"
          required
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="아이디"
          className="rounded-xl border border-transparent bg-surface px-4 py-3.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="비밀번호"
          className="rounded-xl border border-transparent bg-surface px-4 py-3.5 text-sm outline-none focus:border-accent"
        />
        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
