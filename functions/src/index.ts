import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ─── onAdCreate: URL duplicate check + trigger moderation ───────────────────
export const onAdCreate = functions.firestore
  .document("ads/{adId}")
  .onCreate(async (snap, context) => {
    const ad = snap.data();
    const adId = context.params.adId;

    // 1. Check for duplicate URL (same user, active/pending ad with same URL)
    const dupSnap = await db
      .collection("ads")
      .where("advertiserUID", "==", ad.advertiserUID)
      .where("destinationURL", "==", ad.destinationURL)
      .where("status", "in", ["active", "pending"])
      .get();

    const duplicates = dupSnap.docs.filter((d) => d.id !== adId);
    if (duplicates.length > 0) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Bu URL bilan reklama allaqachon mavjud",
      });
      return;
    }

    // 2. Trigger moderation via Next.js API (or call inline)
    await runModeration(adId, ad);
  });

async function runModeration(adId: string, ad: any): Promise<void> {
  try {
    // Check URL reachability
    const fetch = (await import("node-fetch")).default;

    let urlOk = false;
    try {
      const r = await fetch(ad.destinationURL, { method: "HEAD", timeout: 5000 } as any);
      urlOk = r.ok || r.status === 405;
    } catch {
      urlOk = false;
    }

    if (!urlOk) {
      await db.doc(`ads/${adId}`).update({
        status: "rejected",
        rejectionReason: "URL manzilga ulanib bo'lmadi. Saytni tekshiring.",
      });
      return;
    }

    // Google Vision API — safe search
    const visionKey = functions.config().vision?.key || process.env.GOOGLE_VISION_API_KEY;
    if (visionKey && ad.imageURL) {
      const vRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: ad.imageURL } },
              features: [{ type: "SAFE_SEARCH_DETECTION" }],
            }],
          }),
        }
      );
      const vData = await vRes.json() as any;
      const ss = vData.responses?.[0]?.safeSearchAnnotation;
      if (ss) {
        const BLOCKED = ["LIKELY", "VERY_LIKELY"];
        if (BLOCKED.includes(ss.adult) || BLOCKED.includes(ss.violence)) {
          await db.doc(`ads/${adId}`).update({
            status: "rejected",
            rejectionReason: "Rasm moderatsiya talablariga javob bermadi (noma'qul kontent aniqlandi)",
          });
          return;
        }
      }
    }

    // Gemini API — text moderation
    const geminiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const text = [ad.title, ad.description].filter(Boolean).join(". ");
      const gRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Sen reklama moderatorisan. Quyidagi reklama matnini tekshir. Agar matnda haqorat, firib, yashirin reklama yoki qonunga xilof kontent bo'lsa "REJECT: [sabab]" deb yoz. Aks holda faqat "APPROVE" deb yoz.\n\nMatn: "${text}"`,
              }],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
          }),
        }
      );
      const gData = await gRes.json() as any;
      const reply: string = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (reply.startsWith("REJECT")) {
        await db.doc(`ads/${adId}`).update({
          status: "rejected",
          rejectionReason: reply.replace("REJECT:", "").trim() || "Matn moderatsiya talablariga javob bermadi",
        });
        return;
      }
    }

    // ✅ All checks passed — mark as ready for payment (keep "pending")
    await db.doc(`ads/${adId}`).update({
      moderationPassed: true,
      moderationPassedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send FCM push to advertiser
    const userDoc = await db.doc(`users/${ad.advertiserUID}`).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: "Reklamangiz tasdiqlandi ✅",
          body: "To'lovni amalga oshiring va darhol jonli chiqing!",
        },
      });
    }
  } catch (err) {
    console.error("Moderation error:", err);
    // Don't reject on error — leave as pending for manual review
  }
}

// ─── expiryCheck: Run daily at 00:00 UTC ────────────────────────────────────
export const expiryCheck = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const expired = await db
      .collection("ads")
      .where("status", "==", "active")
      .where("expiresAt", "<=", now)
      .get();

    const batch = db.batch();
    for (const doc of expired.docs) {
      batch.update(doc.ref, { status: "expired" });
      // Remove from rankings
      const rankRef = db
        .collection("rankings")
        .doc(doc.data().category)
        .collection("positions")
        .doc(doc.id);
      batch.delete(rankRef);
    }
    await batch.commit();
    console.log(`Expired ${expired.size} ads`);
  });

// ─── expiryWarning: Run daily at 12:00 UTC ──────────────────────────────────
export const expiryWarning = functions.pubsub
  .schedule("0 12 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const now = Date.now();
    const day3 = new Date(now + 3 * 24 * 60 * 60 * 1000);
    const day1 = new Date(now + 1 * 24 * 60 * 60 * 1000);

    const toWarn = await db
      .collection("ads")
      .where("status", "==", "active")
      .where("expiresAt", "<=", admin.firestore.Timestamp.fromDate(day3))
      .get();

    for (const doc of toWarn.docs) {
      const ad = doc.data();
      const expiresMs = ad.expiresAt?.toDate()?.getTime() || 0;
      const daysLeft = Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24));

      const userDoc = await db.doc(`users/${ad.advertiserUID}`).get();
      const fcmToken = userDoc.data()?.fcmToken;
      if (!fcmToken) continue;

      if (daysLeft <= 1) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: "Reklamangiz ertaga tugaydi ⚠️",
            body: `"${ad.title}" — Hozir yangilang!`,
          },
        });
      } else if (daysLeft <= 3) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: "Reklamangiz 3 kunda tugaydi",
            body: `"${ad.title}" — Yangilashni unutmang`,
          },
        });
      }
    }
  });

// ─── onBidUpdate: Recalculate rankings + notify outbid users ────────────────
export const onBidUpdate = functions.firestore
  .document("ads/{adId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const adId = context.params.adId;

    // Only act on bid changes for active ads
    if (
      before.dailyBidCents === after.dailyBidCents ||
      after.status !== "active"
    ) return;

    const category = after.category;

    // Recalculate positions for this category
    const activeAds = await db
      .collection("ads")
      .where("status", "==", "active")
      .where("category", "==", category)
      .orderBy("dailyBidCents", "desc")
      .orderBy("createdAt", "asc")
      .get();

    const batch = db.batch();
    activeAds.docs.forEach((doc, i) => {
      const posRef = db
        .collection("rankings")
        .doc(category)
        .collection("positions")
        .doc(doc.id);
      batch.set(posRef, {
        adId: doc.id,
        dailyBidCents: doc.data().dailyBidCents,
        position: i + 1,
        advertiserUID: doc.data().advertiserUID,
        expiresAt: doc.data().expiresAt,
      });
    });
    await batch.commit();

    // Notify users who got outbid (dropped in position)
    for (const doc of activeAds.docs) {
      if (doc.id === adId) continue; // skip the one who just bid

      const oldPosition = await db
        .collection("rankings")
        .doc(category)
        .collection("positions")
        .doc(doc.id)
        .get();

      const ad = doc.data();
      const userDoc = await db.doc(`users/${ad.advertiserUID}`).get();
      const fcmToken = userDoc.data()?.fcmToken;
      if (!fcmToken) continue;

      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: "Raqibingiz sizdan o'tib ketdi 🔔",
          body: `Yangi raqib $${after.dailyBidCents / 100}/kun to'layapti. Bidni oshiring!`,
        },
      });
    }
  });
