"use client";

import React, { useState } from "react";

// Standard domain lookup for common symbols when assetProfile domain is not yet loaded
const DOMAIN_MAP: Record<string, string> = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOG: "google.com",
  GOOGL: "google.com",
  NVDA: "nvidia.com",
  AMZN: "amazon.com",
  TSLA: "tesla.com",
  META: "meta.com",
  NFLX: "netflix.com",
  TITN: "titanmachinery.com",
  HCI: "hcigroup.com",
  TPCS: "techprecision.com",
  GDYN: "griddynamics.com",
  YSWY: "yesway.com",
  "RELIANCE.NS": "ril.com",
  "TCS.NS": "tcs.com",
  "INFY.NS": "infosys.com",
  "HDFCBANK.NS": "hdfcbank.com",
  "ICICIBANK.NS": "icicibank.com",
  "BTC-USD": "bitcoin.org",
  BTC: "bitcoin.org",
  "ETH-USD": "ethereum.org",
  ETH: "ethereum.org",
  "SOL-USD": "solana.com",
  SOL: "solana.com",
  "XRP-USD": "ripple.com",
  XRP: "ripple.com",
};

export function cleanDomain(urlOrDomain?: string): string | null {
  if (!urlOrDomain) return null;
  try {
    let raw = urlOrDomain.trim().toLowerCase();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = "https://" + raw;
    }
    const parsed = new URL(raw);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlOrDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

interface TickerLogoProps {
  symbol: string;
  name?: string;
  domain?: string;
  size?: number; // size in pixels, default 24
  className?: string;
}

export function TickerLogo({
  symbol,
  name,
  domain,
  size = 24,
  className = "",
}: TickerLogoProps) {
  const cleanSym = symbol?.toUpperCase() || "";
  const resolvedDomain = cleanDomain(domain) || DOMAIN_MAP[cleanSym] || DOMAIN_MAP[cleanSym.split(".")[0]];

  // Source stages: 0 = Google Favicon CDN (via domain), 1 = Parqet Symbol CDN, 2 = Monogram fallback
  const [stage, setStage] = useState<number>(resolvedDomain ? 0 : 1);

  // Derive initial for fallback monogram
  const initial = cleanSym.replace(/[^A-Z]/g, "").slice(0, 2) || (name ? name.slice(0, 1).toUpperCase() : "$");

  const handleError = () => {
    setStage((prev) => prev + 1);
  };

  // Stage 0: Google Favicon CDN via company domain (128px high resolution)
  if (stage === 0 && resolvedDomain) {
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      resolvedDomain
    )}&sz=128`;

    return (
      <div
        className={`rounded bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={googleFaviconUrl}
          alt={name || symbol}
          width={size - 4}
          height={size - 4}
          onError={handleError}
          className="object-contain rounded-[2px]"
          loading="lazy"
        />
      </div>
    );
  }

  // Stage 1: Financial Symbol CDN (Parqet)
  if (stage <= 1 && cleanSym) {
    const parqetSymbolUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(
      cleanSym.split(".")[0]
    )}`;

    return (
      <div
        className={`rounded bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={parqetSymbolUrl}
          alt={name || symbol}
          width={size - 4}
          height={size - 4}
          onError={handleError}
          className="object-contain rounded-[2px]"
          loading="lazy"
        />
      </div>
    );
  }

  // Stage 2 (Final Fallback): Clean, high-contrast graphite monogram with ticker initials
  return (
    <div
      className={`rounded bg-[var(--bg-card-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-bold shrink-0 tracking-tight select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.floor(size * 0.42)),
      }}
    >
      {initial}
    </div>
  );
}
