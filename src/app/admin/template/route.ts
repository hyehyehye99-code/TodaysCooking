import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const headers = [
    "크리에이터이름",
    "채널종류",
    "채널이름",
    "채널링크",
    "크리에이터태그",
    "레시피제목",
    "한줄소개",
    "재료",
    "만드는법",
    "레시피태그",
    "커버사진URL",
    "아이콘이모지",
  ];
  const example1 = [
    "김할매 부엌",
    "유튜브",
    "김할매의 부엌",
    "https://youtube.com/@example",
    "한식,집밥",
    "된장찌개",
    "기본 중의 기본",
    "된장:2큰술\n두부:반모\n애호박:반개\n감자:1개",
    "1. 멸치육수를 끓인다.\n2. 된장을 풀고 채소를 넣는다.\n3. 두부와 감자를 넣고 한소끔 더 끓인다.",
    "한식,국물요리",
    "",
    "🍲",
  ];
  // Same creator as row above — leaving the creator columns blank reuses
  // the existing "김할매 부엌" instead of creating a duplicate.
  const example2 = [
    "김할매 부엌",
    "",
    "",
    "",
    "",
    "계란찜",
    "폭신폭신 기본 계란찜",
    "계란:3개\n물:1컵\n소금:약간",
    "1. 계란을 풀고 물, 소금을 섞는다.\n2. 체에 걸러 뚝배기에 담고 약불에서 저어가며 익힌다.",
    "한식,밑반찬",
    "",
    "🥘",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
  ws["!cols"] = headers.map((h) =>
    h === "재료" || h === "만드는법" ? { wch: 40 } : { wch: 16 }
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "레시피");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="creator_recipes_template.xlsx"',
    },
  });
}
