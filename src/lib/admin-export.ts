import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// Shared by every /admin/*/export route.ts — each one still does its own
// query (they're too different to generalize) but reuses this for the
// admin-gate + "turn an array of plain objects into a downloadable xlsx"
// boilerplate.
export async function requireAdminForExport(): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  return null;
}

export function xlsxResponse(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "data");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
