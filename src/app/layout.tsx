import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stockly.ai | Real-Time Market Intelligence & Financial Terminal",
  description:
    "Live real-time market dashboard tracking India and global markets, stocks, crypto, sparklines, and market summaries powered by Yahoo Finance.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#141517] text-[#EDEDEE] font-sans antialiased selection:bg-emerald-500/25 selection:text-emerald-300">
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
