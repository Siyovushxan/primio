"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, Category } from "@/types";
import { Suspense } from "react";

function CategoryBarInner() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category") as Category | null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href="/browse"
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !active
            ? "bg-violet text-white"
            : "bg-surface border border-border text-muted hover:text-text hover:border-violet/50"
        }`}
      >
        Barchasi
      </Link>
      {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
        const meta = CATEGORIES[cat];
        const isActive = active === cat;
        return (
          <Link
            key={cat}
            href={`/browse?category=${cat}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive
                ? "bg-violet text-white"
                : "bg-surface border border-border text-muted hover:text-text hover:border-violet/50"
            }`}
          >
            <span>{meta.emoji}</span>
            <span className="whitespace-nowrap">{meta.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function CategoryBar() {
  return (
    <Suspense fallback={null}>
      <CategoryBarInner />
    </Suspense>
  );
}
