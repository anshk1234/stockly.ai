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
  KRMN: "karmanholdings.com",
  FLY: "fireflyspace.com",
  FROG: "jfrog.com",
  MMFL: "mmforgings.com",
  IKIO: "ikiolighting.com",
  RAMKY: "ramky.com",
  TTML: "tatateleservices.com",
  "TITAN.NS": "titancompany.in",
  "TATAPOWER.NS": "tatapower.com",
  "VEDL.NS": "vedantaltd.com",
  "POWERGRID.NS": "powergrid.in",
  "KOTAKBANK.NS": "kotak.com",
  "SBIN.NS": "sbi.co.in",
  "BTC-USD": "bitcoin.org",
  BTC: "bitcoin.org",
  "ETH-USD": "ethereum.org",
  ETH: "ethereum.org",
  "SOL-USD": "solana.com",
  SOL: "solana.com",
  "XRP-USD": "ripple.com",
  XRP: "ripple.com",
  "DOGE-USD": "dogecoin.com",
  DOGE: "dogecoin.com",
  "ADA-USD": "cardano.org",
  ADA: "cardano.org",
};

// Verified logos and domains for Benchmark Market Indices
const INDEX_MAP: Record<string, { logoUrl?: string; domain?: string }> = {
  "^NSEI": { domain: "nseindia.com" },
  "^NSEBANK": { domain: "nseindia.com" },
  "^BSESN": { logoUrl: "https://www.bseindia.com/favicon.ico", domain: "bseindia.com" },
  "^DJI": { domain: "dowjones.com" },
  "^GSPC": { domain: "spglobal.com" },
  "^IXIC": { domain: "nasdaq.com" },
};

const BLOCKED_DOMAINS = [
  "coinmarketcap.com",
  "finance.yahoo.com",
  "yahoo.com",
  "google.com",
];

export function cleanDomain(urlOrDomain?: string): string | null {
  if (!urlOrDomain) return null;
  try {
    let raw = urlOrDomain.trim().toLowerCase();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = "https://" + raw;
    }
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");
    if (BLOCKED_DOMAINS.some((b) => host.includes(b))) return null;
    return host;
  } catch {
    const fallback = urlOrDomain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    if (BLOCKED_DOMAINS.some((b) => fallback.includes(b))) return null;
    return fallback;
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
  const isCrypto =
    cleanSym.endsWith("-USD") ||
    ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "BNB", "USDT"].includes(cleanSym);
  const cryptoCode = cleanSym.split("-")[0].toLowerCase();

  const indexConfig = INDEX_MAP[cleanSym];

  const resolvedDomain =
    indexConfig?.domain ||
    cleanDomain(domain) ||
    DOMAIN_MAP[cleanSym] ||
    DOMAIN_MAP[cleanSym.split(".")[0]];

  // Stage 0:
  // - If index with direct logoUrl: load directly
  // - If crypto: load dedicated CoinCap high-res icon
  // - If stock with domain: load Google Favicon
  // - Otherwise: Parqet / fallback
  const [stage, setStage] = useState<number>(0);

  const handleError = () => {
    setStage((prev) => prev + 1);
  };

  // Derive initial for fallback monogram
  const initial =
    cleanSym.replace(/[^A-Z]/g, "").slice(0, 2) ||
    (name ? name.slice(0, 1).toUpperCase() : "$");

  // 1. Direct Index Logo (e.g. BSE India official favicon)
  if (stage === 0 && indexConfig?.logoUrl) {
    return (
      <div
        className={`rounded bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={indexConfig.logoUrl}
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

  // 2. Crypto Official Coin Icons (CoinCap high-resolution 2x icons)
  if (stage <= 1 && isCrypto && cryptoCode) {
    const cryptoIconUrl = `https://assets.coincap.io/assets/icons/${encodeURIComponent(
      cryptoCode
    )}@2x.png`;

    return (
      <div
        className={`rounded bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={cryptoIconUrl}
          alt={name || symbol}
          width={size - 2}
          height={size - 2}
          onError={handleError}
          className="object-contain rounded-full"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Google Favicon CDN via verified company / index domain
  if (stage <= 2 && resolvedDomain) {
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

  // 4. Parqet Financial Symbol CDN
  if (stage <= 3 && cleanSym && !cleanSym.startsWith("^")) {
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

  // 5. Final Fallback: Clean, high-contrast graphite monogram with ticker initials
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
