import type { Metadata } from "next";
import "./globals.css";
import "./primio.css";
import "./flows.css";
import Header from "@/components/layout/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";

export const metadata: Metadata = {
  title: "Primio — Brendingiz uchun yangi o‘rin",
  description: "Reklamangizni joylashtiring, kunlik taklifingizni belgilang va toifa reytingidagi o‘rningiz hamda natijalarni kuzating.",
  keywords: "advertising, auction, ad platform, ranking",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "PRIMIO",
    description: "The highest bidder ranks first.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-bg text-text font-sans antialiased">
        <LangProvider>
          <AuthProvider>
            <a className="p-skip" href="#main-content">Asosiy kontentga o‘tish / Skip to content</a>
            <Header />
            <main id="main-content">{children}</main>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
