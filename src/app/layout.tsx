import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "PRIMIO — Reklama auktion platformasi",
  description: "Kim ko'proq to'lasa — yuqorida turadi. Global reklama auksiyon platformasi.",
  keywords: "reklama, auktion, advertising, platform",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "PRIMIO",
    description: "Kim ko'proq to'lasa — yuqorida turadi.",
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
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
