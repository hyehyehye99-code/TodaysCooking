"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/lib/actions/admin";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLoginAction, null);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-6">
          <p className="text-sm font-bold leading-none">우리집 레시피</p>
          <p className="mt-1 text-[11px] font-semibold leading-none text-ink-faint">Admin</p>
        </div>
        <form action={formAction} className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-bold">관리자 로그인</h1>
          <input
            name="username"
            placeholder="아이디"
            autoComplete="off"
            className="mb-2 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            className="mb-4 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          {state?.error && <p className="mb-3 text-xs text-warn-ink">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
