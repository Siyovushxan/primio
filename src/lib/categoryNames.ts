import type { Category } from "@/types";

export type UiLang = "uz" | "en" | "ru";

export const CATEGORY_NAMES: Record<UiLang, Record<Category, string>> = {
  uz: {
    technology: "Texnologiya", food: "Ovqat", fashion: "Moda",
    education: "Taʼlim", health: "Salomatlik", real_estate: "Uy-joy",
    entertainment: "Koʻngilochar", other: "Boshqa",
  },
  en: {
    technology: "Technology", food: "Food", fashion: "Fashion",
    education: "Education", health: "Health", real_estate: "Real estate",
    entertainment: "Entertainment", other: "Other",
  },
  ru: {
    technology: "Технологии", food: "Еда", fashion: "Мода",
    education: "Образование", health: "Здоровье", real_estate: "Недвижимость",
    entertainment: "Развлечения", other: "Другое",
  },
};

export function uiLang(lang: string): UiLang {
  return lang === "uz" || lang === "ru" ? lang : "en";
}

export function formatUsd(cents: number): string {
  const d = cents / 100;
  return Number.isInteger(d) ? `$${d}` : `$${d.toFixed(2)}`;
}
