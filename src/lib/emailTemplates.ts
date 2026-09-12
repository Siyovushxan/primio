const BASE = "https://primio.com.uz";

const wrap = (content: string) => `<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1230">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

        <!-- Header -->
        <tr><td style="padding-bottom:20px">
          <a href="${BASE}" style="text-decoration:none">
            <span style="font-family:'Arial Black',sans-serif;font-size:20px;font-weight:900;color:#7C3AED;letter-spacing:-.02em">PRIMIO</span>
          </a>
        </td></tr>

        ${content}

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center">
          <p style="font-size:12px;color:#9CA3AF;margin:0">
            © 2026 PRIMIO · <a href="${BASE}" style="color:#7C3AED;text-decoration:none">primio.com.uz</a>
          </p>
          <p style="font-size:11px;color:#C4B5FD;margin:6px 0 0">
            Ushbu xabar PRIMIO platformasi orqali yuborildi.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Outbid notification ──────────────────────────────────────────────────────
export interface OutbidEmailData {
  advertiserName: string;
  adTitle: string;
  category: string;
  yourBidUsd: string;        // e.g. "$5.00"
  winnerBidUsd: string;      // e.g. "$8.50"
  adId: string;
  currentPosition: number;   // their new position (2, 3, ...)
}

export function outbidEmail(d: OutbidEmailData): { subject: string; html: string } {
  return {
    subject: `⚠️ Kimdir sizni oshirib o'tdi! — ${d.adTitle}`,
    html: wrap(`
      <tr><td style="background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;margin-bottom:16px">
        <p style="font-size:36px;margin:0 0 12px">⚡</p>
        <h1 style="font-size:20px;font-weight:800;color:#1a1230;margin:0 0 8px;line-height:1.3">
          Kimdir sizni reytingda oshirib o'tdi
        </h1>
        <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 20px">
          Salom <strong>${d.advertiserName}</strong>, <strong>"${d.adTitle}"</strong> reklamangiz
          <strong>${d.category}</strong> kategoriyasida pastga tushdi.
        </p>

        <!-- Bid comparison -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr>
            <td width="48%" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:14px;text-align:center">
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#92400e;margin:0 0 6px">SIZNING TAKLIF</p>
              <p style="font-size:22px;font-weight:800;color:#78350f;margin:0;font-family:'Courier New',monospace">${d.yourBidUsd}</p>
            </td>
            <td width="4%" style="text-align:center;color:#9ca3af;font-size:18px">→</td>
            <td width="48%" style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px;text-align:center">
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#166534;margin:0 0 6px">YANGI LIDER</p>
              <p style="font-size:22px;font-weight:800;color:#15803d;margin:0;font-family:'Courier New',monospace">${d.winnerBidUsd}</p>
            </td>
          </tr>
        </table>

        <p style="font-size:14px;color:#374151;margin:0 0 20px;padding:12px 14px;background:#fafafa;border-radius:10px;border-left:3px solid #7C3AED">
          Hozirgi o'rningiz: <strong>#${d.currentPosition}</strong> — Taklifingizni oshirish bilan birinchi o'ringa qaytishingiz mumkin.
        </p>

        <a href="${BASE}/ads/${d.adId}/bid"
           style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-weight:700;font-size:14px;padding:13px 24px;border-radius:12px;text-decoration:none">
          Taklifni oshirish →
        </a>
      </td></tr>
    `),
  };
}

// ── Weekly performance report ────────────────────────────────────────────────
export interface WeeklyAdStat {
  adId: string;
  title: string;
  category: string;
  status: string;
  dailyBidUsd: string;
  clicks: number;
  impressions: number;
}

export interface WeeklyReportEmailData {
  advertiserName: string;
  ads: WeeklyAdStat[];
  totalSpentUsd: string;
}

export function weeklyReportEmail(d: WeeklyReportEmailData): { subject: string; html: string } {
  const activeAds = d.ads.filter((a) => a.status === "active");
  const totalClicks = d.ads.reduce((s, a) => s + a.clicks, 0);
  const totalImpressions = d.ads.reduce((s, a) => s + a.impressions, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  const adRows = d.ads
    .map(
      (a) => `
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:#1a1230;border-bottom:1px solid #f3f4f6">
          <strong>${a.title}</strong><br>
          <span style="font-size:11px;color:#6b7280">${a.category}</span>
        </td>
        <td style="padding:10px 12px;text-align:center;font-size:13px;border-bottom:1px solid #f3f4f6">
          <span style="padding:2px 8px;border-radius:100px;font-size:11px;font-weight:700;background:${a.status === "active" ? "#dcfce7" : "#fee2e2"};color:${a.status === "active" ? "#166534" : "#991b1b"}">
            ${a.status === "active" ? "Faol" : a.status === "paused" ? "To'xtatilgan" : a.status}
          </span>
        </td>
        <td style="padding:10px 12px;text-align:center;font-size:13px;font-family:'Courier New',monospace;font-weight:700;color:#7C3AED;border-bottom:1px solid #f3f4f6">${a.dailyBidUsd}</td>
        <td style="padding:10px 12px;text-align:center;font-size:13px;border-bottom:1px solid #f3f4f6">${a.clicks.toLocaleString()}</td>
        <td style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">${a.impressions.toLocaleString()}</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `📊 Haftalik hisobot — ${d.advertiserName} | PRIMIO`,
    html: wrap(`
      <tr><td style="background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;margin-bottom:16px">
        <p style="font-size:30px;margin:0 0 10px">📊</p>
        <h1 style="font-size:20px;font-weight:800;color:#1a1230;margin:0 0 6px">Haftalik hisobot</h1>
        <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Salom <strong>${d.advertiserName}</strong>! Bu haftangi ko'rsatkichlar:</p>

        <!-- KPIs -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr>
            <td width="32%" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:14px;text-align:center">
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7C3AED;margin:0 0 4px">FAOL REKLAMA</p>
              <p style="font-size:26px;font-weight:800;color:#7C3AED;margin:0">${activeAds.length}</p>
            </td>
            <td width="2%"></td>
            <td width="32%" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;text-align:center">
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#92400e;margin:0 0 4px">JAMI KLIK</p>
              <p style="font-size:26px;font-weight:800;color:#92400e;margin:0">${totalClicks.toLocaleString()}</p>
            </td>
            <td width="2%"></td>
            <td width="32%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;text-align:center">
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#166534;margin:0 0 4px">CTR</p>
              <p style="font-size:26px;font-weight:800;color:#166534;margin:0">${ctr}%</p>
            </td>
          </tr>
        </table>

        <!-- Ads table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.05em;text-transform:uppercase">REKLAMA</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.05em;text-transform:uppercase">HOLAT</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.05em;text-transform:uppercase">BID/KUN</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.05em;text-transform:uppercase">KLIK</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.05em;text-transform:uppercase">KO'RISH</th>
            </tr>
          </thead>
          <tbody>${adRows}</tbody>
        </table>

        <p style="font-size:12px;color:#9ca3af;margin:16px 0 20px">
          Jami sarflangan: <strong style="color:#1a1230">${d.totalSpentUsd}</strong>
        </p>

        <a href="${BASE}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-weight:700;font-size:14px;padding:13px 24px;border-radius:12px;text-decoration:none">
          Dashboard →
        </a>
      </td></tr>
    `),
  };
}
