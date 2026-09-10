import type { Timestamp } from "firebase/firestore";

export type AdStatus =
  | "pending"
  | "pending_verification"
  | "active"
  | "expired"
  | "rejected";

export type PaymentMethod =
  | "google_pay"
  | "apple_pay"
  | "paypal"
  | "crypto"
  | "card";

export type TransactionType = "purchase" | "bid_upgrade" | "refund";

export type Category =
  | "technology"
  | "food"
  | "fashion"
  | "education"
  | "health"
  | "real_estate"
  | "entertainment"
  | "other";

export interface Ad {
  id: string;
  advertiserUID: string;
  title: string;
  imageURL: string;
  destinationURL: string;
  category: Category;
  dailyBidCents: number;
  durationDays: 7 | 14 | 30;
  totalPaidCents: number;
  status: AdStatus;
  startsAt: Timestamp | null;
  expiresAt: Timestamp | null;
  impressions: number;
  clicks: number;
  externalTxId: string;
  paymentMethod: PaymentMethod | "";
  rejectionReason?: string;
  createdAt: Timestamp;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  totalSpentCents: number;
  isNewAccount: boolean;
  createdAt: Timestamp;
}

export interface RankingPosition {
  adId: string;
  dailyBidCents: number;
  position: number;
  advertiserUID: string;
  expiresAt: Timestamp;
  title: string;
  imageURL: string;
  destinationURL: string;
}

export interface Transaction {
  id: string;
  uid: string;
  adId: string;
  type: TransactionType;
  amountCents: number;
  externalTxId: string;
  paymentMethod: string;
  createdAt: Timestamp;
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; description: string }> = {
  technology: { label: "Technology & Software", emoji: "💻", description: "IT firmalar, ilovalar, SaaS" },
  food: { label: "Food & Restaurants", emoji: "🍽️", description: "Restoranlar, yetkazib berish" },
  fashion: { label: "Fashion & Lifestyle", emoji: "👗", description: "Kiyim, aksessuarlar, go'zallik" },
  education: { label: "Education & Training", emoji: "📚", description: "Kurslar, maktablar, o'quv markazlari" },
  health: { label: "Health & Wellness", emoji: "🏥", description: "Klinikalar, fitness, farmatsevtika" },
  real_estate: { label: "Real Estate & Services", emoji: "🏠", description: "Uy-joy, huquqiy xizmat, ta'mirlash" },
  entertainment: { label: "Entertainment & Events", emoji: "🎭", description: "Konsertlar, o'yinlar, turizm" },
  other: { label: "Other / General", emoji: "🌐", description: "Boshqa barcha yo'nalishlar" },
};
