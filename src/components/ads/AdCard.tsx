"use client";

import Image from "next/image";
import Link from "next/link";
import { Ad, CATEGORIES } from "@/types";
import { ExternalLink, Eye, MousePointerClick } from "lucide-react";

interface AdCardProps {
  ad: Ad;
  position: number;
  featured?: boolean;
}

const MEDAL = ["🥇", "🥈", "🥉"];

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

async function trackImpression(adId: string) {
  fetch(`/api/ads/${adId}/impression`, { method: "POST" }).catch(() => {});
}

export default function AdCard({ ad, position, featured }: AdCardProps) {
  const catMeta = CATEGORIES[ad.category];
  const medal = MEDAL[position - 1] || `#${position}`;
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";

  const handleClick = () => {
    fetch(`/api/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  };

  return (
    <div
      className={`card rounded-2xl overflow-hidden hover:border-violet/40 transition-all group ${
        featured && position === 1 ? "ring-1 ring-gold/30" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-code overflow-hidden">
        {ad.imageURL ? (
          <Image
            src={ad.imageURL}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={() => trackImpression(ad.id)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted/30">
            <div className="text-4xl">📷</div>
          </div>
        )}

        {/* Position badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="text-base">{medal}</span>
          <span className="text-xs font-mono font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {formatCents(ad.dailyBidCents)}/kun
          </span>
        </div>

        {/* Category */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white/80">
          {catMeta?.emoji} {catMeta?.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-text text-base mb-1 line-clamp-1 group-hover:text-violet-light transition-colors">
          {ad.title}
        </h3>
        <p className="text-xs text-muted mb-3 truncate">{ad.destinationURL}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted mb-4">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {formatNum(ad.impressions)}
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick size={12} />
            {formatNum(ad.clicks)}
          </span>
          <span>CTR: {ctr}%</span>
        </div>

        {/* CTA */}
        <a
          href={ad.destinationURL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 btn-primary py-2 text-sm"
        >
          <ExternalLink size={14} />
          Saytni ko'rish
        </a>
      </div>
    </div>
  );
}
