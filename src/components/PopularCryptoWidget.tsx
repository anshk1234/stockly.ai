"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";

interface CryptoMover {
  symbol: string;
  name: string;
  displaySymbol: string;
  price: number;
  changePercent: number;
}

const DEFAULT_CRYPTOS: CryptoMover[] = [
  {
    symbol: "BTC-USD",
    name: "Bitcoin",
    displaySymbol: "BTCUSD · CRYPTO",
    price: 75851.48,
    changePercent: -0.04,
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum",
    displaySymbol: "ETHUSD · CRYPTO",
    price: 2234.92,
    changePercent: -0.36,
  },
  {
    symbol: "SOL-USD",
    name: "Solana",
    displaySymbol: "SOLUSD · CRYPTO",
    price: 89.24,
    changePercent: -0.66,
  },
  {
    symbol: "XRP-USD",
    name: "XRP",
    displaySymbol: "XRPUSD · CRYPTO",
    price: 1.16,
    changePercent: -0.75,
  },
];

// 60-second module-level cache
let cryptoCache: { data: CryptoMover[]; timestamp: number } | null = null;

export function PopularCryptoWidget() {
  const [cryptos, setCryptos] = useState<CryptoMover[]>(() => {
    return cryptoCache?.data || DEFAULT_CRYPTOS;
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadCryptos() {
      const now = Date.now();
      if (cryptoCache && now - cryptoCache.timestamp < 60000) {
        setCryptos(cryptoCache.data);
        return;
      }

      try {
        const res = await fetch(
          "/api/watchlist?symbols=BTC-USD,ETH-USD,SOL-USD,XRP-USD"
        );
        const data = await res.json();
        if (isCurrent && data.quotes && Array.isArray(data.quotes)) {
          const map: Record<string, any> = {};
          data.quotes.forEach((q: any) => {
            map[q.symbol] = q;
          });

          const updated = DEFAULT_CRYPTOS.map((def) => {
            const live = map[def.symbol];
            if (live) {
              return {
                ...def,
                name: live.name || def.name,
                price: typeof live.price === "number" ? live.price : def.price,
                changePercent:
                  typeof live.changePercent === "number"
                    ? live.changePercent
                    : def.changePercent,
              };
            }
            return def;
          });

          cryptoCache = { data: updated, timestamp: Date.now() };
          setCryptos(updated);
        }
      } catch (err) {
        console.warn("Failed to load popular cryptocurrencies:", err);
      }
    }

    loadCryptos();
    return () => {
      isCurrent = false;
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="w-full">
      <SectionTitle>Popular Cryptocurrencies</SectionTitle>

      <Card className="p-[var(--space-3)]">
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {cryptos.map((item) => {
            const isGain = item.changePercent >= 0;
            return (
              <Link
                key={item.symbol}
                href={`/stocks/${encodeURIComponent(item.symbol)}`}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between group hover:opacity-90 transition-opacity"
              >
                {/* Left: Icon, Name & Subtitle */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-[#22242a]">
                    <TickerLogo symbol={item.symbol} name={item.name} size={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)] group-hover:text-[var(--positive)] transition-colors truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] tracking-tight">
                      {item.displaySymbol}
                    </div>
                  </div>
                </div>

                {/* Right: Price & Percent Change */}
                <div className="text-right shrink-0">
                  <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                    {formatPrice(item.price)}
                  </div>
                  <div
                    className="text-[11px] font-[var(--weight-medium)] tabular-nums"
                    style={{ color: isGain ? "#3ecf8e" : "#f2555a" }}
                  >
                    {isGain ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function MarketDisclosure() {
  return (
    <div className="text-[11px] text-[var(--text-muted)] leading-[1.6] px-1 space-y-2 opacity-80 hover:opacity-100 transition-opacity">
      <p>
        Financial information provided by Yahoo Finance, CoinCap, NSE, and BSE. Options and market sentiment intelligence provided by Polymarket and Livemint. Charting and visual market intelligence powered by Stockly.ai.
      </p>
      <p>
        All data is provided for informational purposes only, and is not intended for trading purposes or financial, investment, tax, legal, accounting or other advice.
      </p>
    </div>
  );
}
