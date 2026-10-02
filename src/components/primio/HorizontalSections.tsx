"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { pick } from "./shared";

export default function HorizontalSections({ children, labels }: { children: ReactNode; labels: string[] }) {
  const { lang } = useLang();
  const track = useRef<HTMLDivElement>(null);
  const activeIndex = useRef(0);
  const [current, setCurrent] = useState(0);
  const goTo = useCallback((index: number) => {
    const element = track.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeIndex.current = Math.max(0, Math.min(labels.length - 1, index));
    element.scrollTo({ left: activeIndex.current * element.clientWidth, behavior: reducedMotion ? "instant" : "smooth" });
  }, [labels.length]);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    document.documentElement.classList.add("p-home-open");
    let frame = 0;
    let wheelTotal = 0;
    let lastWheel = 0;
    let lockedUntil = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        activeIndex.current = Math.max(0, Math.min(labels.length - 1, Math.round(element.scrollLeft / element.clientWidth)));
        setCurrent(activeIndex.current);
      });
    };
    const wheel = (event: WheelEvent) => {
      // Preserve pinch-to-zoom and native form controls. Trackpad horizontal scrolling stays native.
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, select, textarea, [role='dialog']")) return;
      // At high zoom or in a short viewport, allow overflowing panel content to remain reachable.
      const panel = target?.closest<HTMLElement>(".p-home-slide");
      if (panel && panel.scrollHeight > panel.clientHeight + 2 &&
        ((event.deltaY > 0 && panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2) ||
         (event.deltaY < 0 && panel.scrollTop > 0))) return;
      event.preventDefault();
      const now = performance.now();
      if (now < lockedUntil) return;
      if (now - lastWheel > 220 || Math.sign(wheelTotal) !== Math.sign(event.deltaY)) wheelTotal = 0;
      lastWheel = now;
      wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      if (Math.abs(wheelTotal) < 45) return;
      const index = Math.round(element.scrollLeft / element.clientWidth);
      goTo(index + Math.sign(wheelTotal));
      wheelTotal = 0;
      lockedUntil = now + 600;
    };
    const fromHash = () => {
      const index = { "#start": 0, "#ads": 1, "#how": 2, "#pricing": 2 }[window.location.hash];
      if (index !== undefined) goTo(index);
    };
    const resize = new ResizeObserver(() => {
      const active = element.querySelector<HTMLElement>(".p-home-slide:focus-within");
      const index = active ? Array.from(element.children).indexOf(active) : activeIndex.current;
      element.scrollTo({ left: Math.max(0, index) * element.clientWidth, behavior: "instant" });
    });
    resize.observe(element);
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", fromHash);
    fromHash();
    return () => {
      document.documentElement.classList.remove("p-home-open");
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", fromHash);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [goTo, labels.length]);

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const next = { ArrowRight: current + 1, PageDown: current + 1, ArrowLeft: current - 1, PageUp: current - 1, Home: 0, End: labels.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); goTo(next); }
  }

  return <div className="p-horizontal-home p-site">
    <div ref={track} className="p-home-track" tabIndex={0} role="region" aria-label={pick(lang, "Bosh sahifa bo‘limlari", "Home page sections", "Разделы главной страницы")} onKeyDown={keyboard} onFocusCapture={event => {
      const panel = (event.target as HTMLElement).closest<HTMLElement>(".p-home-slide");
      if (panel && track.current) goTo(Array.from(track.current.children).indexOf(panel));
    }}>{children}</div>
    <nav className="p-home-controls" aria-label={pick(lang, "Bo‘limlar bo‘ylab o‘tish", "Section navigation", "Навигация по разделам")}>
      <span className="p-home-scroll-hint">{pick(lang, "Skrol qiling yoki suring", "Scroll or swipe", "Прокрутите или смахните")} <ArrowRight size={15}/></span>
      <div className="p-home-tabs">{labels.map((label, index) => <button key={index} type="button" aria-current={current === index ? "step" : undefined} onClick={() => goTo(index)}><span>0{index + 1}</span>{label}</button>)}</div>
      <div className="p-home-arrows">
        <button type="button" disabled={current === 0} aria-label={pick(lang, "Oldingi bo‘lim", "Previous section", "Предыдущий раздел")} onClick={() => goTo(current - 1)}><ArrowLeft size={18}/></button>
        <span aria-live="polite">{current + 1} / {labels.length}</span>
        <button type="button" disabled={current === labels.length - 1} aria-label={pick(lang, "Keyingi bo‘lim", "Next section", "Следующий раздел")} onClick={() => goTo(current + 1)}><ArrowRight size={18}/></button>
      </div>
    </nav>
  </div>;
}
