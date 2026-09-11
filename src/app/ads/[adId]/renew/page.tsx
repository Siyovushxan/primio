"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, CATEGORIES } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { RotateCcw } from "lucide-react";

export default function RenewPage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<7 | 14 | 30>(7);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!adId) return;
    getDoc(doc(db, "ads", adId)).then((snap) => {
      if (!snap.exists()) { router.push("/dashboard"); return; }
      const data = { id: snap.id, ...snap.data() } as Ad;
      if (data.advertiserUID !== firebaseUser?.uid) { router.push("/dashboard"); return; }
      setAd(data);
      setDuration(data.durationDays);
      setLoading(false);
    });
  }, [adId, firebaseUser, router]);

  if (loading || !ad) {
    return <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-muted">Yuklanmoqda...</div>;
  }

  const dailyUSD = ad.dailyBidCents / 100;
  const total = dailyUSD * duration;
  const catMeta = CATEGORIES[ad.category];

  const handleRenew = async () => {
    setPaying(true);
    try {
      const idToken = await firebaseUser!.getIdToken();
      const res = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          adId: ad.id,
          amount: Math.round(total * 100),
          type: "renewal",
          durationDays: duration,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch (err: any) {
      alert("Xato: " + err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="font-heading text-3xl text-text mb-1">Reklamani yangilash</h1>
          <p className="text-muted text-sm">{catMeta.emoji} {catMeta.label}</p>
        </div>

        {/* Ad info */}
        <div className="card rounded-2xl p-5">
          <h3 className="font-semibold text-text mb-3">{ad.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Kunlik bid (o'zgarmaydi)</span>
              <span className="font-mono font-bold text-gold">${dailyUSD}/kun</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">URL</span>
              <span className="text-muted truncate max-w-[200px]">{ad.destinationURL}</span>
            </div>
          </div>
          <div className="mt-3 p-2.5 bg-emerald/5 border border-emerald/20 rounded-lg">
            <p className="text-xs text-emerald">✓ Moderatsiya o'tkazib yuboriladi — kontent o'zgarmagan</p>
          </div>
        </div>

        {/* Duration selection */}
        <div>
          <label className="text-xs text-muted font-medium mb-3 block">Yangi davr tanlang</label>
          <div className="grid grid-cols-3 gap-3">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                  duration === d
                    ? "border-violet bg-violet/10 text-violet-light"
                    : "border-border text-muted hover:border-violet/40"
                }`}
              >
                {d} kun
                <div className={`text-xs font-normal mt-0.5 ${duration === d ? "text-violet-light/70" : "text-muted/60"}`}>
                  ${(dailyUSD * d).toFixed(0)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-code rounded-xl p-4 border border-border">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text">Jami</span>
            <span className="font-heading text-3xl text-emerald">${total.toFixed(0)}</span>
          </div>
          <p className="text-xs text-muted mt-1">To'lovdan keyin darhol jonli bo'ladi</p>
        </div>

        <button
          onClick={handleRenew}
          disabled={paying}
          className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          {paying ? "Yo'naltirilmoqda..." : `$${total.toFixed(0)} to'lash va jonlashtirish`}
        </button>

        <button onClick={() => router.back()} className="w-full text-sm text-muted hover:text-text text-center">
          ← Bekor qilish
        </button>
      </div>
    </div>
  );
}
