import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_ROOT = "https://analyticsdata.googleapis.com/v1beta";
const GOOGLE_ADMIN_ROOT = "https://analyticsadmin.googleapis.com/v1beta";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export type AnalyticsRange = { startDate: string; endDate: string };
export type GoogleProperty = { propertyId: string; displayName: string };
export type AnalyticsReport = {
  source: "Google Analytics 4";
  propertyName: string;
  range: AnalyticsRange;
  fetchedAt: string;
  timezone: string;
  metrics: { activeUsers: number | null; newUsers: number | null; pageViews: number | null; sessions: number | null; clickEvents: number | null };
  countries: Array<{ country: string; activeUsers: number }>;
  daily: Array<{ date: string; activeUsers: number; pageViews: number; sessions: number }>;
  notes: string[];
};

function encryptionKey(): Buffer {
  const raw = process.env.ANALYTICS_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("analytics_encryption_not_configured");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("analytics_encryption_key_invalid");
  return key;
}

export function encryptRefreshToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}

export function decryptRefreshToken(value: string): string {
  const [ivText, tagText, encryptedText] = value.split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("analytics_token_invalid");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
}

export function isGoogleAnalyticsConfigured(): boolean {
  if (!process.env.GOOGLE_ANALYTICS_CLIENT_ID || !process.env.GOOGLE_ANALYTICS_CLIENT_SECRET || !process.env.GOOGLE_ANALYTICS_REDIRECT_URI) return false;
  try { encryptionKey(); return true; } catch { return false; }
}

export function isPropertyId(value: unknown): value is string {
  return typeof value === "string" && /^\d{5,20}$/.test(value);
}

function getYmd(now: number, timezone = "Asia/Tashkent"): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftYmd(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseAnalyticsRange(search: URLSearchParams, now = Date.now(), timezone = "Asia/Tashkent"): AnalyticsRange {
  const today = getYmd(now, timezone);
  const preset = search.get("range") || "7d";
  if (preset === "today") return { startDate: today, endDate: today };
  if (preset === "yesterday") {
    const yesterday = shiftYmd(today, -1);
    return { startDate: yesterday, endDate: yesterday };
  }
  if (preset === "7d" || preset === "30d") {
    const length = preset === "7d" ? 7 : 30;
    return { startDate: shiftYmd(today, -(length - 1)), endDate: today };
  }
  const startDate = search.get("startDate") || "";
  const endDate = search.get("endDate") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("analytics_date_range_invalid");
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const todayStart = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || new Date(start).toISOString().slice(0, 10) !== startDate || new Date(end).toISOString().slice(0, 10) !== endDate || start > end || end > todayStart || (end - start) / 86400000 >= 90) throw new Error("analytics_date_range_invalid");
  return { startDate, endDate };
}

async function googleJson(url: string, accessToken: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const code = response.status === 401 || response.status === 403 ? "google_analytics_permission_required" : response.status === 429 ? "google_analytics_rate_limited" : "google_analytics_unavailable";
    throw new Error(code);
  }
  return body;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_ANALYTICS_CLIENT_ID!, client_secret: process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const body = await response.json().catch(() => ({})) as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error(response.status === 400 || response.status === 401 ? "google_analytics_reconnect_required" : "google_analytics_unavailable");
  return body.access_token;
}

export async function listGoogleProperties(accessToken: string): Promise<GoogleProperty[]> {
  const body = await googleJson(`${GOOGLE_ADMIN_ROOT}/accountSummaries?pageSize=200`, accessToken);
  const accounts = Array.isArray(body.accountSummaries) ? body.accountSummaries as Array<Record<string, unknown>> : [];
  return accounts.flatMap(account => Array.isArray(account.propertySummaries) ? account.propertySummaries as Array<Record<string, unknown>> : [])
    .map(property => ({ propertyId: typeof property.property === "string" ? property.property.replace(/^properties\//, "") : "", displayName: typeof property.displayName === "string" ? property.displayName : "Google Analytics property" }))
    .filter((property, index, all) => isPropertyId(property.propertyId) && all.findIndex(item => item.propertyId === property.propertyId) === index)
    .slice(0, 200);
}

export async function getGooglePropertyTimezone(accessToken: string, propertyId: string): Promise<string> {
  const body = await googleJson(`${GOOGLE_ADMIN_ROOT}/properties/${propertyId}`, accessToken);
  return typeof body.timeZone === "string" && body.timeZone.length < 80 ? body.timeZone : "UTC";
}

type ApiRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };
type ApiReport = { rows?: ApiRow[]; propertyQuota?: unknown };

async function runReport(accessToken: string, propertyId: string, range: AnalyticsRange, metrics: string[], dimensions: string[] = [], dimensionFilter?: object): Promise<ApiReport> {
  const body: Record<string, unknown> = { dateRanges: [range], metrics: metrics.map(name => ({ name })) };
  if (dimensions.length) body.dimensions = dimensions.map(name => ({ name }));
  if (dimensionFilter) body.dimensionFilter = dimensionFilter;
  return await googleJson(`${GOOGLE_API_ROOT}/properties/${propertyId}:runReport`, accessToken, { method: "POST", body: JSON.stringify(body) }) as ApiReport;
}

function metricValue(row: ApiRow | undefined, index: number): number | null {
  const value = row?.metricValues?.[index]?.value;
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getGoogleAnalyticsReport(accessToken: string, propertyId: string, propertyName: string, range: AnalyticsRange, timezone = "UTC"): Promise<AnalyticsReport> {
  if (!isPropertyId(propertyId)) throw new Error("analytics_property_invalid");
  const [summary, countryReport, dailyReport, clickReport] = await Promise.all([
    runReport(accessToken, propertyId, range, ["activeUsers", "newUsers", "screenPageViews", "sessions"]),
    runReport(accessToken, propertyId, range, ["activeUsers"], ["country"]),
    runReport(accessToken, propertyId, range, ["activeUsers", "screenPageViews", "sessions"], ["date"]),
    runReport(accessToken, propertyId, range, ["eventCount"], [], { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "click" } } }),
  ]);
  const summaryRow = summary.rows?.[0];
  const clickEvents = metricValue(clickReport.rows?.[0], 0);
  return {
    source: "Google Analytics 4", propertyName, range, fetchedAt: new Date().toISOString(), timezone,
    metrics: { activeUsers: metricValue(summaryRow, 0), newUsers: metricValue(summaryRow, 1), pageViews: metricValue(summaryRow, 2), sessions: metricValue(summaryRow, 3), clickEvents },
    countries: (countryReport.rows || []).map(row => ({ country: row.dimensionValues?.[0]?.value || "(not set)", activeUsers: metricValue(row, 0) })).filter((row): row is { country: string; activeUsers: number } => row.activeUsers !== null).sort((a, b) => b.activeUsers - a.activeUsers).slice(0, 10),
    daily: (dailyReport.rows || []).map(row => ({ date: row.dimensionValues?.[0]?.value || "", activeUsers: metricValue(row, 0), pageViews: metricValue(row, 1), sessions: metricValue(row, 2) })).filter((row): row is { date: string; activeUsers: number; pageViews: number; sessions: number } => /^\d{8}$/.test(row.date) && row.activeUsers !== null && row.pageViews !== null && row.sessions !== null).map(row => ({ ...row, date: `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}` })),
    notes: ["GA4 ma’lumoti; yangilanish xizmatga bog‘liq ravishda kechikishi mumkin.", "Yangi foydalanuvchi ro‘yxatdan o‘tgan hisob degani emas.", "Click soni faqat GA4’da qayd etilgan click hodisalarini qamrab oladi.", "Kunlik faol foydalanuvchilar sonini qo‘shish davr bo‘yicha takrorlanmagan foydalanuvchilar soniga teng emas."],
  };
}

export { GOOGLE_SCOPE };
