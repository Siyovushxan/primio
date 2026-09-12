import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebaseAdmin";
import { weeklyReportEmail, WeeklyAdStat } from "@/lib/emailTemplates";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sends Bearer {CRON_SECRET}, manual trigger uses x-admin-secret
  const authHeader = req.headers.get("authorization");
  const adminKey = req.headers.get("x-admin-secret");

  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdminCall = adminSecret && adminKey === adminSecret;

  if (!isVercelCron && !isAdminCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get all non-expired ads (active + paused)
    const adsSnap = await adminDb
      .collection("ads")
      .where("status", "in", ["active", "paused"])
      .get();

    if (adsSnap.empty) {
      return NextResponse.json({ sent: 0, message: "Faol reklama yo'q" });
    }

    // 2. Group ads by advertiserUID
    const byAdvertiser: Record<string, WeeklyAdStat[]> = {};
    adsSnap.docs.forEach((doc) => {
      const d = doc.data();
      const uid: string = d.advertiserUID;
      if (!uid) return;
      if (!byAdvertiser[uid]) byAdvertiser[uid] = [];
      byAdvertiser[uid].push({
        adId: doc.id,
        title: d.title || "Nomsiz reklama",
        category: d.category || "—",
        status: d.status || "unknown",
        dailyBidUsd: `$${((d.dailyBidCents || 0) / 100).toFixed(2)}`,
        clicks: d.clicks || 0,
        impressions: d.impressions || 0,
      });
    });

    const uids = Object.keys(byAdvertiser);

    // 3. Fetch user docs in batches of 10 (Firestore `in` limit)
    const userMap: Record<string, { email: string; displayName: string; totalSpentCents: number }> = {};
    for (let i = 0; i < uids.length; i += 10) {
      const batch = uids.slice(i, i + 10);
      const usersSnap = await adminDb
        .collection("users")
        .where("__name__", "in", batch)
        .get();
      usersSnap.docs.forEach((doc) => {
        const d = doc.data();
        userMap[doc.id] = {
          email: d.email || "",
          displayName: d.displayName || "Advertiser",
          totalSpentCents: d.totalSpentCents || 0,
        };
      });
    }

    // 4. Send email to each advertiser (max 50 concurrent)
    let sent = 0;
    let skipped = 0;
    const entries = Object.entries(byAdvertiser);

    for (let i = 0; i < entries.length; i += 50) {
      const chunk = entries.slice(i, i + 50);
      await Promise.all(
        chunk.map(async ([uid, ads]) => {
          const user = userMap[uid];
          if (!user?.email) { skipped++; return; }

          const { subject, html } = weeklyReportEmail({
            advertiserName: user.displayName,
            ads,
            totalSpentUsd: `$${(user.totalSpentCents / 100).toFixed(0)}`,
          });

          try {
            await resend.emails.send({
              from: "PRIMIO <noreply@primio.com.uz>",
              to: user.email,
              subject,
              html,
            });
            sent++;
          } catch (err) {
            console.error(`Email yuborishda xato (${user.email}):`, err);
            skipped++;
          }
        }),
      );
    }

    return NextResponse.json({
      sent,
      skipped,
      total: entries.length,
      message: `${sent} ta reklamachiga haftalik hisobot yuborildi`,
    });
  } catch (err: any) {
    console.error("Weekly report error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
