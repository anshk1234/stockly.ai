import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stockly.ai | Real-Time Market Intelligence & Financial Terminal",
  description: "Live real-time market dashboard tracking India and global markets, stocks, crypto, sparklines, and market summaries powered by Yahoo Finance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0D14] text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
