"use client";

import { useEffect, useRef } from "react";

// Ads already counted during this page load
const counted = new Set<string>();

/**
 * Counts one impression when at least half of the element stays on screen for one second
 * (the common viewability definition). Each ad is counted once per page load; the API
 * additionally rate-limits per visitor. Pass skip=true for the ad owner's own views.
 */
export function useImpression<T extends HTMLElement>(adId: string, skip = false) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || skip || counted.has(adId) || typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer ??= setTimeout(() => {
            if (counted.has(adId)) return;
            counted.add(adId);
            observer.disconnect();
            fetch(`/api/ads/${adId}/impression`, { method: "POST", keepalive: true }).catch(() => {});
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [adId, skip]);

  return ref;
}
