import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinConfirmForm } from "./join-confirm-form";
import { JoinWithGoogleButton } from "./join-with-google-button";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();

  const shell = (content: React.ReactNode) => (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col justify-center px-7 pb-[max(env(safe-area-inset-bottom),40px)]">
      {content}
    </div>
  );

  if (!code) {
    return shell(
      <div className="text-center">
        <p className="text-lg font-bold">유효하지 않은 초대 링크예요</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-accent underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  const { data: household } = (await supabase
    .rpc("get_household_by_invite_code", { p_invite_code: code })
    .maybeSingle()) as { data: { id: string; name: string } | null };

  if (!household) {
    return shell(
      <div className="text-center">
        <p className="text-lg font-bold">유효하지 않은 초대 코드예요</p>
        <p className="mt-2 text-sm text-ink-soft">코드가 정확한지 다시 확인해주세요.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-accent underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("household_id", household.id)
      .eq("user_id", user.id)
      .maybeSingle();
    alreadyMember = !!membership;
  }

  return shell(
    <div className="text-center">
      <span className="text-[64px] leading-none">🍳</span>
      <p className="mt-5 text-xl font-bold">
        {household.name}에 초대되었어요
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        참여하면 이 부엌의 메뉴판·냉장고·장보기 목록을 함께 써요.
      </p>

      <div className="mt-8 w-full">
        {alreadyMember ? (
          <Link
            href="/recipes"
            className="block w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-white"
          >
            이미 참여 중이에요 · 메뉴판으로
          </Link>
        ) : user ? (
          <JoinConfirmForm code={code} />
        ) : (
          <JoinWithGoogleButton code={code} />
        )}
      </div>
    </div>
  );
}
