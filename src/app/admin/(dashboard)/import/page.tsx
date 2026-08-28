import Link from "next/link";
import { ImportForm } from "./import-form";

export default function AdminImportPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/creators" className="text-sm font-semibold text-ink-faint">
          ← 목록
        </Link>
      </div>
      <h1 className="mb-2 text-xl font-bold">엑셀로 가져오기</h1>
      <div className="mb-4 flex flex-col gap-1.5 text-sm text-ink-soft">
        <p>한 행이 레시피 하나예요. 같은 크리에이터이름을 여러 행에 쓰면 그 밑에 레시피가 여러 개 등록되고, 이미 있는 크리에이터 이름이면 새로 만들지 않고 기존 크리에이터에 추가돼요.</p>
        <p>레시피제목과 링크를 둘 다 비워두고 크리에이터이름만 채우면, 레시피 없이 그 크리에이터만 등록돼요.</p>
        <p>링크만 채우고 재료·만드는법을 비워두면 AI가 그 링크에서 자동으로 채워요 — 여러 행에 링크만 쭉 넣고 한 번에 돌리면 돼요. 제목도 비워두면 AI가 지어줘요.</p>
      </div>
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
