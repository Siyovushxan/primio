import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { analyticsIdentity, getGoogleAccessToken } from "@/lib/analytics-auth";
import { getGoogleAnalyticsReport, parseAnalyticsRange } from "@/lib/google-analytics";

const XAI_URL = "https://api.x.ai/v1/chat/completions";

export async function POST(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  try {
    const body = await req.json();
    if (body.consent !== true) return NextResponse.json({ error: "analytics_insight_consent_required" }, { status: 400 });
    if (!process.env.XAI_API_KEY) return NextResponse.json({ error: "analytics_insight_unavailable" }, { status: 503 });
    const { accessToken, connection } = await getGoogleAccessToken(identity.uid);
    if (!connection.propertyId || !connection.propertyName) return NextResponse.json({ error: "analytics_property_required" }, { status: 409 });
    const timezone = connection.timezone || "UTC";
    const rangeParams = new URLSearchParams({ range: typeof body.range === "string" ? body.range : "7d" });
    if (typeof body.startDate === "string") rangeParams.set("startDate", body.startDate);
    if (typeof body.endDate === "string") rangeParams.set("endDate", body.endDate);
    const range = parseAnalyticsRange(rangeParams, Date.now(), timezone);
    const report = await getGoogleAnalyticsReport(accessToken, connection.propertyId, connection.propertyName, range, timezone);
    const numbers = Object.values(report.metrics);
    if (numbers.every(value => value === null) && !report.countries.length) return NextResponse.json({ error: "analytics_report_no_data" }, { status: 422 });

    const limitRef = adminDb.doc(`analyticsInsightLimits/${identity.uid}_${new Date().toISOString().slice(0, 10)}`);
    const allowed = await adminDb.runTransaction(async tx => {
      const snap = await tx.get(limitRef);
      const count = Number(snap.data()?.count || 0);
      if (count >= 5) return false;
      tx.set(limitRef, { uid: identity.uid, count: count + 1, updatedAt: Timestamp.now() }, { merge: true });
      return true;
    });
    if (!allowed) return NextResponse.json({ error: "analytics_insight_daily_limit" }, { status: 429 });

    const safeData = {
      period: report.range,
      timezone: report.timezone,
      metrics: report.metrics,
      leadingCountries: report.countries.slice(0, 5),
    };
    const response = await fetch(XAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      body: JSON.stringify({
        model: "grok-3-mini",
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: "system", content: "You are a careful small-business analytics adviser. Use only the supplied aggregate Google Analytics 4 numbers. Never invent values, causes, comparisons, or guaranteed outcomes. Say when data is insufficient. Distinguish active users from registered accounts; Google Analytics newUsers is not registrations. Give one short status sentence and up to three concrete actions, each tied to a supplied metric and a measurable follow-up. Do not ask for personal data. Reply in Uzbek Latin." },
          { role: "user", content: JSON.stringify(safeData) },
        ],
      }),
    });
    const result = await response.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string } }> };
    const text = result.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !text) return NextResponse.json({ error: "analytics_insight_unavailable" }, { status: 502 });
    return NextResponse.json({ text, source: "Google Analytics 4", range: report.range, fetchedAt: new Date().toISOString(), shared: ["faol foydalanuvchilar yig‘indisi", "yangi foydalanuvchilar yig‘indisi", "sahifa ko‘rilishlari", "sessiyalar", "click hodisalari", "davlatlar bo‘yicha yig‘ma sonlar"] });
  } catch (error) {
    const code = error instanceof Error ? error.message : "analytics_insight_unavailable";
    const status = code === "analytics_insight_consent_required" ? 400 : code === "google_analytics_not_connected" || code === "analytics_property_required" ? 409 : code.includes("not_configured") ? 503 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
