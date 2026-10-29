// Best-before dates are plain 'YYYY-MM-DD' strings compared in Korea time, so
// "today" means the same thing on the server (assistant prompt) and the client.
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayKst(now = Date.now()) {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

// Days from today until the date: 0 = today, negative = already past.
export function daysUntil(expiresOn: string, today = todayKst()) {
  return Math.round((Date.parse(`${expiresOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
}

export const EXPIRING_SOON_DAYS = 3;

export function expiryLabel(days: number) {
  if (days < 0) return `${-days}일 지남`;
  if (days === 0) return "오늘까지";
  return `D-${days}`;
}

export function expiryTone(days: number) {
  if (days < 0) return "bg-red-50 text-red-600";
  if (days <= EXPIRING_SOON_DAYS) return "bg-accent/10 text-accent";
  return "bg-surface text-ink-soft";
}
