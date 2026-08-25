import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

export function chefName(nickname: string | null | undefined, dict: Dictionary) {
  if (!nickname) return dict.components.unnamedChef;
  return dict.components.chefSuffixTemplate.replace("{name}", nickname);
}
