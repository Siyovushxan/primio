"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, Category, CATEGORIES } from "@/types";
import { ArrowLeftRight, TrendingUp } from "lucide-react";

interface Props {
  category: Category;
  onChangeCategory: () => void;
}

interface BidInfo {
  position: number;
  dailyBidCents: number;
  title: string;
}

export default function CategoryPricePreview({ category, onChangeCategory }: Props) {
  const [bids, setBids] = useState<BidInfo[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);

  const meta = CATEGORIES[category];
  const MEDAL = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "ads"),
          where("status", "==", "active"),
          where("category", "==", category),
          orderBy("dailyBidCents", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        const ads = snap.docs.map((d, i) => ({
          position: i + 1,
          dailyBidCents: d.data().dailyBidCents as number,
          title: d.data().title as string,
        }));
        setBids(ads);
        setTotalActive(snap.size);
      } catch {
        setBids([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category]);

  // Minimum to reach position 2
  const top1Bid = bids[0]?.dailyBidCents || 0;
  const recommendedBid = top1Bid > 0 ? top1Bid + 100 : 300; // +$1 above top or $3 minimum

  const minBid = bids.length > 0
    ? (bids[bids.length - 1]?.dailyBidCents || 100) - 50
    : 100;

  return (
    <div className="card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <h3 className="font-semibold text-text">{meta.label}</h3>
            <p className="text-xs text-muted">Joriy raqobat holati</p>
          </div>
        </div>
        <button
          onClick={onChangeCategory}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors"
        >
          <ArrowLeftRight size={14} />
          O'zgartirish
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-code rounded-lg animate-pulse" />
          ))}
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-4 text-center">
          <p className="text-emerald font-semibold text-sm mb-1">🎉 Bu toifada birinchi bo'ling!</p>
          <p className="text-muted text-xs">Hali hech qanday reklama yo'q. Minimal $1/kun bilan 1-o'rinda bo'lasiz.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {bids.slice(0, 5).map((bid, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 px-3 bg-code rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">{MEDAL[i] || `#${i + 1}`}</span>
                <span className="text-sm text-muted truncate max-w-[180px]">{bid.title}</span>
              </div>
              <span className="font-mono text-sm font-bold text-text">
                ${(bid.dailyBidCents / 100).toFixed(0)}/kun
              </span>
            </div>
          ))}
          {totalActive > 5 && (
            <p className="text-xs text-muted text-center py-1">
              ...va yana {totalActive - 5} ta reklama
            </p>
          )}
        </div>
      )}

      {/* Recommendation */}
      {bids.length > 0 && (
        <div className="bg-violet/10 border border-violet/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-violet-light" />
            <span className="text-sm font-semibold text-violet-light">Tavsiya</span>
          </div>
          <p className="text-sm text-text">
            <span className="font-bold text-gold">${(recommendedBid / 100).toFixed(0)}/kun</span>
            {" "}bilan 1-o'ringa chiqasiz
          </p>
          <p className="text-xs text-muted mt-1">
            Minimal: ${Math.max(minBid / 100, 1).toFixed(0)}/kun · Jami faol: {totalActive} ta reklama
          </p>
        </div>
      )}
    </div>
  );
}
