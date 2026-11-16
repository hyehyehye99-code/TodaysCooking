import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { notifyHousehold } from "@/lib/actions/activity";

// Lets the native iOS app trigger the same household notifications the web's
// server actions send. The app writes to Supabase directly (shopping items,
// ...), which bypasses those server actions — and with them the push — so it
// calls this route afterwards instead. Authenticates like /api/ai/assistant
// (Authorization: Bearer <token> + x-active-household-id). Wording matches
// the web's own notifications so both clients read the same.
type NotifyRequest =
  | { kind: "shopping_added"; names: string[] }
  | { kind: "shopping_completed"; count: number }
  | { kind: "recipe_proposed"; recipeId: string; title: string; note?: string };

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return json({ error: "로그인이 필요해요." }, 401);

  let body: NotifyRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "잘못된 요청이에요." }, 400);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
  const nickname = profile?.nickname ?? "누군가";

  let notification: { title: string; body: string; url: string } | null = null;

  if (body.kind === "shopping_added") {
    const names = (Array.isArray(body.names) ? body.names : []).map((n) => clean(n, 60)).filter(Boolean).slice(0, 50);
    if (names.length === 0) return json({ error: "추가한 항목이 없어요." }, 400);
    notification = {
      title: "장보기 목록 추가",
      body:
        names.length === 1
          ? `${nickname}님이 "${names[0]}"을(를) 장보기에 추가했어요`
          : `${nickname}님이 "${names[0]}" 외 ${names.length - 1}개를 장보기에 추가했어요`,
      url: "/shopping",
    };
  } else if (body.kind === "shopping_completed") {
    const count = Number.isFinite(body.count) ? Math.max(0, Math.min(500, Math.trunc(body.count))) : 0;
    if (count === 0) return json({ error: "추가한 재료가 없어요." }, 400);
    notification = {
      title: "장보기 완료",
      body: `${nickname}님이 장보기를 완료하고 재료 ${count}개를 냉장고에 추가했어요`,
      url: "/mypage/fridge",
    };
  } else if (body.kind === "recipe_proposed") {
    const title = clean(body.title, 80);
    const recipeId = clean(body.recipeId, 64);
    if (!title || !/^[0-9a-f-]{36}$/i.test(recipeId)) return json({ error: "잘못된 요청이에요." }, 400);
    // Only recipes that really belong to this household can be proposed.
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .eq("household_id", household.id)
      .maybeSingle();
    if (!recipe) return json({ error: "레시피를 찾을 수 없어요." }, 404);
    const note = clean(body.note, 120);
    notification = {
      title: "요리 제안",
      body: note ? `${nickname}님이 "${title}"을(를) 제안했어요: ${note}` : `${nickname}님이 "${title}"을(를) 해 먹자고 제안했어요`,
      url: `/recipes/${recipeId}`,
    };
  }

  if (!notification) return json({ error: "잘못된 요청이에요." }, 400);

  try {
    await notifyHousehold(household.id, user.id, notification);
    return json({ ok: true });
  } catch (err) {
    console.error("[push/notify] failed:", err);
    return json({ error: "알림을 보내지 못했어요." }, 502);
  }
}
