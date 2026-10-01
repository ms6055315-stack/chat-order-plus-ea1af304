/** Local calendar-day helpers. Never use toISOString() for day keys: it is UTC
 * and shifts the day for shops open past midnight in UTC+ timezones. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
