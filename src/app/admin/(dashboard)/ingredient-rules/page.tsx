import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_UNIT_SUFFIXES,
  DEFAULT_QUANTITY_WORDS,
  DEFAULT_COUNT_WORDS,
  DEFAULT_PHRASES,
  type IngredientRuleType,
} from "@/lib/ingredientParsing";
import { RuleCategoryEditor } from "./rule-category-editor";

type Row = { id: string; type: IngredientRuleType; value: string };

export default async function IngredientRulesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ingredient_parse_rules")
    .select("id, type, value")
    .order("created_at", { ascending: false });
  const rows = (data as Row[] | null) ?? [];
  const byType = (type: IngredientRuleType) => rows.filter((r) => r.type === type);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">재료 이름/단위 분리 예외 관리</h1>
      <p className="mb-6 text-sm text-ink-soft">
        레시피 재료를 저장할 때 &ldquo;재료 이름&rdquo;과 &ldquo;단위&rdquo;를 자동으로 나누는
        규칙이에요. 여기서 추가하면 코드 수정 없이 바로 다음 저장부터 반영돼요.
      </p>

      <div className="flex flex-col gap-6">
        <RuleCategoryEditor
          type="unit_suffix"
          title="단위 접미사"
          description='끝이 이 글자로 끝나면 단위로 인식해요. 예: "개", "스푼", "꼬집" → "쪽파 3개"의 "3개"'
          defaults={DEFAULT_UNIT_SUFFIXES}
          rules={byType("unit_suffix")}
          placeholder="예: 다발"
        />
        <RuleCategoryEditor
          type="quantity_word"
          title="수량 전용 단어"
          description='숫자가 없어도 이 단어만 있으면 단위로 인식해요. 예: "약간", "듬뿍"'
          defaults={DEFAULT_QUANTITY_WORDS}
          rules={byType("quantity_word")}
          placeholder="예: 한바가지"
        />
        <RuleCategoryEditor
          type="count_word"
          title="숫자말 (개수 표현)"
          description='"두 주먹", "반 스푼"처럼 단위 앞에 띄어 쓰는 숫자말이에요.'
          defaults={DEFAULT_COUNT_WORDS}
          rules={byType("count_word")}
          placeholder="예: 몇몇"
        />
        <RuleCategoryEditor
          type="phrase"
          title="여러 단어 수량 구문"
          description='"큰 것"처럼 띄어쓰기가 있는 통째 구문이에요.'
          defaults={DEFAULT_PHRASES}
          rules={byType("phrase")}
          placeholder="예: 작은 것"
        />
      </div>
    </div>
  );
}
