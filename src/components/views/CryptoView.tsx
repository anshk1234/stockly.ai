"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { AssetQuote, NewsItem } from "@/lib/types";
import { formatPrice, formatPercent, formatChange } from "@/lib/utils";
import { SparklineChart } from "@/components/SparklineChart";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { MarketSummary, SourceItem } from "@/components/MarketSummary";

interface CryptoViewProps {
  watchlist: AssetQuote[];
  isLoadingWatchlist: boolean;
  onOpenSearch: () => void;
}

const CRYPTO_PREDICTIONS = [
  {
    id: "cpred-1",
    title: "Bitcoin above ___ on November 6?",
    volume: "$1.2M vol.",
    platform: "+8 on Polymarket",
    options: [
      { label: "68,000", percentage: 100.0, change: 0.2 },
      { label: "70,000", percentage: 100.0, change: 0.2 },
      { label: "72,000", percentage: 99.0, change: -1.1 },
    ],
  },
  {
    id: "cpred-2",
    title: "What price will Bitcoin hit in November?",
    volume: "$3.7M vol.",
    platform: "+22 on Polymarket",
    options: [
      { label: "↓ 75,000", percentage: 86.0, change: 39.0 },
      { label: "↑ 77,500", percentage: 86.0, change: 0.0 },
      { label: "↓ 72,500", percentage: 63.0, change: 33.0 },
    ],
  },
  {
    id: "cpred-3",
    title: "What price will Bitcoin hit in 2026?",
    volume: "$82M vol.",
    platform: "+42 on Polymarket",
    options: [
      { label: "↓ 70,000", percentage: 54.0, change: 20.0 },
      { label: "↓ 65,000", percentage: 33.0, change: 14.0 },
      { label: "↑ 90,000", percentage: 24.0, change: 15.0 },
    ],
  },
];

// In-memory client cache for instant (0ms) Back navigation from asset detail pages
let cachedCryptoData: {
  movements: AssetQuote[];
  news: NewsItem[];
  sourcesCount: number;
  sources: SourceItem[];
  lastUpdated: Date;
  timestamp: number;
} | null = null;

export function CryptoView({
  watchlist,
  isLoadingWatchlist,
  onOpenSearch,
}: CryptoViewProps) {
  const [cryptoMovements, setCryptoMovements] = useState<AssetQuote[]>(() => cachedCryptoData?.movements || []);
  const [cryptoNews, setCryptoNews] = useState<NewsItem[]>(() => cachedCryptoData?.news || []);
  const [sourcesCount, setSourcesCount] = useState<number>(() => cachedCryptoData?.sourcesCount || 0);
  const [sources, setSources] = useState<SourceItem[]>(() => cachedCryptoData?.sources || []);
  const [isLoading, setIsLoading] = useState(() => !cachedCryptoData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => cachedCryptoData?.lastUpdated || null);

  useEffect(() => {
    async function loadCryptoData() {
      const isFresh = cachedCryptoData && (Date.now() - cachedCryptoData.timestamp < 60000);
      if (!isFresh) {
        if (!cachedCryptoData) setIsLoading(true);
      }

      try {
        const [cryptoRes, newsRes] = await Promise.all([
          fetch("/api/crypto"),
          fetch("/api/news?category=CRYPTO"),
        ]);
        const cryptoData = await cryptoRes.json();
        const newsData = await newsRes.json();

        const itemDate = newsData.lastUpdated ? new Date(newsData.lastUpdated) : new Date();

        if (cryptoData.movements) setCryptoMovements(cryptoData.movements);
        if (newsData.news) {
          setCryptoNews(newsData.news);
          setSourcesCount(newsData.sourcesCount || newsData.news.length);
          setSources(newsData.sources || []);
        }
        setLastUpdated(itemDate);

        cachedCryptoData = {
          movements: cryptoData.movements || [],
          news: newsData.news || [],
          sourcesCount: newsData.sourcesCount || newsData.news?.length || 0,
          sources: newsData.sources || [],
          lastUpdated: itemDate,
          timestamp: Date.now(),
        };
      } catch (err) {
        console.error("Failed to load crypto view data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCryptoData();
  }, []);

  const mainContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      {/* Top Crypto Movement Strip */}
      <div className="w-full">
        <SectionTitle
          action={
            isLoading && <RefreshCw className="w-3 h-3 text-[var(--text-muted)] animate-spin" />
          }
        >
          Crypto Movements
        </SectionTitle>

        {isLoading && cryptoMovements.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-3)]">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden flex flex-col justify-between"
              >
                <div className="px-3.5 pt-3 pb-1 flex items-start justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <Skeleton className="h-3.5 w-12" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                </div>
                <Skeleton className="h-11 w-full rounded-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-3)]">
            {cryptoMovements.map((coin) => {
              const isPositive = coin.changePercent >= 0;

              return (
                <Link
                  key={coin.symbol}
                  href={`/stocks/${coin.symbol}`}
                  className="group relative flex flex-col justify-between bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden transition-colors shadow-sm cursor-pointer"
                >
                  <div className="px-3.5 pt-3 pb-1 flex items-start justify-between z-10">
                    <div>
                      <div className="text-[12px] font-[var(--weight-regular)] text-[var(--text-muted)] leading-tight group-hover:text-[var(--text-primary)] transition-colors">
                        {coin.name}
                      </div>
                      <div className="text-[14.5px] font-[var(--weight-medium)] text-[var(--text-primary)] tracking-tight mt-0.5 tabular-nums">
                        {formatPrice(coin.price, "USD")}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div
                        className={`flex items-center gap-0.5 text-[11.5px] font-[var(--weight-medium)] tabular-nums ${
                          isPositive ? "text-positive" : "text-negative"
                        }`}
                        style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
                        )}
                        <span>{formatPercent(coin.changePercent)}</span>
                      </div>

                      <div className="text-[10.5px] text-[var(--text-muted)] leading-tight mt-0.5">
                        {formatChange(coin.change, "USD")}
                      </div>
                    </div>
                  </div>

                  {/* Full-Bleed Edge-to-Edge Sparkline */}
                  <div className="w-full h-11 mt-1 overflow-hidden">
                    <SparklineChart
                      data={coin.sparkline}
                      isPositive={isPositive}
                      height={44}
                      width={240}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Crypto Market Summary - Powered by Perplexity-style MarketSummary component */}
      <MarketSummary
        news={cryptoNews}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        sourcesCount={sourcesCount}
        sources={sources}
      />
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      <WatchlistWidget
        items={watchlist}
        isLoading={isLoadingWatchlist}
        onManageWatchlist={onOpenSearch}
      />

      {/* Crypto Prediction Markets */}
      <div className="w-full">
        <SectionTitle>Prediction Markets</SectionTitle>

        <div className="flex flex-col gap-[var(--space-3)]">
          {CRYPTO_PREDICTIONS.map((card) => (
            <Card key={card.id} className="p-[16px]">
              <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] mb-[var(--space-2)] leading-snug">
                {card.title}
              </div>

              <div className="flex flex-col gap-[var(--space-2)] mb-[var(--space-3)]">
                {card.options.map((opt, i) => {
                  const isPositive = opt.change >= 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-[var(--text-xs)]">
                      <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">
                        {opt.label}
                      </span>
                      <div className="flex items-center gap-[var(--space-2)]">
                        <span className="font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                          {opt.percentage.toFixed(1)}%
                        </span>
                        <div
                          className={`flex items-center gap-0.5 text-[var(--text-xs)] font-[var(--weight-medium)] tabular-nums ${
                            isPositive ? "text-positive" : "text-negative"
                          }`}
                          style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
                          )}
                          <span>{Math.abs(opt.change).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--text-muted)] pt-[var(--space-2)] border-t border-[var(--border)]">
                <span>{card.volume}</span>
                <span className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-[var(--weight-medium)]">
                  {card.platform}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return <TwoColumnLayout main={mainContent} sidebar={sidebarContent} />;
}
