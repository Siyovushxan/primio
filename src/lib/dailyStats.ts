// Per-day counters for the dashboard chart: ads/{adId}/daily/{YYYY-MM-DD}.
// Days are counted in Tashkent time, where the advertisers are.

export const STATS_TIME_ZONE = "Asia/Tashkent";

export function statsDayKey(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STATS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** The last `days` day keys, oldest first, ending today. */
export function lastDayKeys(days: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(statsDayKey(new Date(now.getTime() - i * 86_400_000)));
  return keys;
}
