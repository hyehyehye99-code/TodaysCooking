import Link from "next/link";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { Mascot } from "@/components/Mascot";

export default async function AssistantPage() {
  const [{ user }, { dict }] = await Promise.all([getCurrentHousehold(), getDictionary()]);

  // The assistant reads and writes the household's recipes, so it needs an account.
  if (!user) {
    return (
      <div className="mt-16 flex flex-col items-center text-center">
        <Mascot name="chef-greeting" size={128} />
        <p className="mt-5 text-base font-bold text-ink">{dict.guest.loginRequiredTitle}</p>
        <p className="mt-1.5 text-sm text-ink-soft">AI 셰프는 로그인하면 쓸 수 있어요.</p>
        <Link href="/login" className="mt-6 rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-white">
          {dict.guest.loginButton}
        </Link>
      </div>
    );
  }

  return <AssistantChat />;
}
