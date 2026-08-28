import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ImportForm } from "./import-form";

export default async function AdminImportPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/creators" className="text-sm font-semibold text-ink-faint">
          ← 목록
        </Link>
      </div>
      <h1 className="mb-2 text-xl font-bold">엑셀로 대량 등록</h1>
      <p className="mb-4 text-sm text-ink-soft">
        한 행이 레시피 하나예요. 같은 크리에이터이름을 여러 행에 쓰면 그 크리에이터 밑에 레시피가 여러 개
        등록되고, 이미 있는 크리에이터 이름이면 새로 만들지 않고 기존 크리에이터에 추가돼요.
      </p>
      <a
        href="/admin/template"
        className="mb-6 inline-block rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
      >
        ⬇ 템플릿 다운로드
      </a>
      <ImportForm />
    </div>
  );
}
