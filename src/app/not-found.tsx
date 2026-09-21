import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { dict } = await getDictionary();

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col items-center justify-center px-7 text-center">
      <Mascot name="confused" size={128} />
      <p className="mt-5 text-lg font-bold text-ink">{dict.common.notFoundTitle}</p>
      <Link href="/recipes" className="mt-6 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white">
        {dict.common.notFoundBack}
      </Link>
    </div>
  );
}
