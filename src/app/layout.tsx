import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";

export const metadata: Metadata = {
  title: "PRIMIO — Global Ad Auction Platform",
  description: "The highest bidder ranks first. Global ad auction platform.",
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
    <html lang="en">
      <body className="min-h-screen bg-bg text-text font-sans antialiased">
        <LangProvider>
          <AuthProvider>
            <Header />
            <main>{children}</main>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
