import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple admin secret check — set ADMIN_SECRET in Vercel env vars
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read all waitlist emails from Firestore
    const snapshot = await adminDb.collection("waitlist").get();
    const emails: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) emails.push(data.email);
    });

    if (emails.length === 0) {
      return NextResponse.json({ sent: 0, message: "Waitlist bo'sh" });
    }

    // Send emails in batches of 50 (Resend batch limit)
    const BATCH = 50;
    let sent = 0;
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH);
      await Promise.all(
        batch.map((email) =>
          resend.emails.send({
            from: "PRIMIO <noreply@primio.com.uz>",
            to: email,
            subject: "🚀 PRIMIO — To'lov tizimi ishga tushdi!",
            html: `
<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0E0B1A;font-family:'Helvetica Neue',Arial,sans-serif;color:#EDE9FE">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 16px">
    <tr><td>
      <!-- Logo -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="display:flex;align-items:center;gap:10px">
            <span style="font-family:'Arial Black',sans-serif;font-size:22px;font-weight:900;color:#EDE9FE;letter-spacing:-.02em">PRIMIO</span>
            <span style="background:#7C3AED;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;margin-left:8px">LIVE</span>
          </td>
        </tr>
      </table>

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1230;border:1px solid #2D1F50;border-radius:20px;padding:32px;margin-bottom:20px">
        <tr><td>
          <p style="font-size:40px;margin:0 0 16px">🎉</p>
          <h1 style="font-size:24px;font-weight:800;color:#EDE9FE;margin:0 0 10px;line-height:1.3">
            To'lov tizimi ishga tushdi!
          </h1>
          <p style="font-size:15px;color:#A78BFA;line-height:1.7;margin:0 0 24px">
            Kutganingiz uchun rahmat. PRIMIO to'lov tizimi endi to'liq ishlaydi — reklamangizni hoziroq faollashtiring.
          </p>
          <a href="https://primio.com.uz/dashboard"
             style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#1A1230;font-weight:800;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
            Dashboardga o'tish →
          </a>
        </td></tr>
      </table>

      <!-- Steps -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#160F2A;border:1px solid #2D1F50;border-radius:16px;padding:20px;margin-bottom:20px">
        <tr><td>
          <p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6D5B8E;margin:0 0 14px">KEYINGI QADAMLAR</p>
          <p style="font-size:14px;color:#EDE9FE;margin:0 0 8px">✅ &nbsp;Dashboard ga kiring</p>
          <p style="font-size:14px;color:#EDE9FE;margin:0 0 8px">💳 &nbsp;Reklamangizni to'lang</p>
          <p style="font-size:14px;color:#EDE9FE;margin:0">🚀 &nbsp;Reklama darhol jonli bo'ladi</p>
        </td></tr>
      </table>

      <p style="font-size:12px;color:#4A3C6E;text-align:center;margin:20px 0 0">
        © 2026 PRIMIO · <a href="https://primio.com.uz" style="color:#6D5B8E">primio.com.uz</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`,
          })
        )
      );
      sent += batch.length;
    }

    return NextResponse.json({ sent, total: emails.length, message: `${sent} ta emailga xabar yuborildi` });
  } catch (err: any) {
    console.error("Waitlist notify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
