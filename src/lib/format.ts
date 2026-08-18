export function chefName(nickname: string | null | undefined) {
  if (!nickname) return "이름 없는 셰프";
  return `${nickname}셰프`;
}
