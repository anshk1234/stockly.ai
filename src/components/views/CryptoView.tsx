"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Clock, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { AssetQuote, NewsItem } from "@/lib/types";
import { formatPrice, formatPercent, formatChange, formatTimeAgo } from "@/lib/utils";
import { SparklineChart } from "@/components/SparklineChart";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";

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

export function CryptoView({
  watchlist,
  isLoadingWatchlist,
  onOpenSearch,
}: CryptoViewProps) {
  const [cryptoMovements, setCryptoMovements] = useState<AssetQuote[]>([]);
  const [cryptoNews, setCryptoNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCryptoData() {
      setIsLoading(true);
      try {
        const [cryptoRes, newsRes] = await Promise.all([
          fetch("/api/crypto"),
          fetch("/api/news?category=CRYPTO"),
        ]);
        const cryptoData = await cryptoRes.json();
        const newsData = await newsRes.json();

        if (cryptoData.movements) setCryptoMovements(cryptoData.movements);
        if (newsData.news) {
          setCryptoNews(newsData.news);
          if (newsData.news.length > 0) setExpandedNewsId(newsData.news[0].id);
        }
        setLastUpdated(new Date());
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
          Crypto Movement
        </SectionTitle>

        {isLoading && cryptoMovements.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-3)]">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden flex flex-col justify-between shadow-sm"
              >
                <div className="px-3.5 pt-3 pb-1">
                  <Skeleton className="h-3 w-20 mb-2.5" />
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-5 w-24" />
                    <div className="flex flex-col items-end gap-1.5">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-2.5 w-10" />
                    </div>
                  </div>
                </div>
                <div className="w-full h-11 mt-1">
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-3)]">
            {cryptoMovements.map((coin) => {
              const isPositive = coin.changePercent >= 0;
              return (
                <Link
                  key={coin.symbol}
                  href={`/stocks/${encodeURIComponent(coin.symbol)}`}
                  className="group relative flex flex-col justify-between bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden transition-colors shadow-sm cursor-pointer"
                >
                  <div className="px-3.5 pt-3 pb-1">
                    <div className="text-[11.5px] font-[var(--weight-medium)] text-[var(--text-muted)] truncate mb-1 group-hover:text-[var(--text-primary)] transition-colors">
                      {coin.name}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[14px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums whitespace-nowrap">
                        {formatPrice(coin.price, "USD")}
                      </div>

                      <div className="flex flex-col items-end shrink-0 tabular-nums">
                        <div
                          className={`flex items-center gap-0.5 text-[11px] font-[var(--weight-medium)] leading-tight ${
                            isPositive ? "text-positive" : "text-negative"
                          }`}
                          style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
                          )}
                          <span>{formatPercent(coin.changePercent, false)}</span>
                        </div>
                        <div className="text-[10.5px] text-[var(--text-muted)] leading-tight mt-0.5">
                          {formatChange(coin.change, "USD")}
                        </div>
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

      {/* Crypto Market Summary - In ONE card with hairline dividers */}
      <div className="w-full">
        <SectionTitle
          action={
            <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] font-[var(--weight-regular)]">
              <Clock className="w-3 h-3" />
              <span>{lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Fetching updates..."}</span>
            </div>
          }
        >
          Market Summary
        </SectionTitle>

        <Card>
          {isLoading && cryptoNews.length === 0 ? (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              <div className="px-[16px] py-[14px]">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <div className="flex items-center justify-between pt-3">
                  <Skeleton className="h-2.5 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-[16px] py-[14px]">
                  <Skeleton className={`h-3.5 ${i === 0 ? "w-2/3" : i === 1 ? "w-4/5" : "w-1/2"}`} />
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            cryptoNews.map((item, index) => {
              const isExpanded = expandedNewsId === item.id || (!expandedNewsId && index === 0);

              return (
                <div
                  key={item.id}
                  className="border-b border-[var(--border)] last:border-b-0 transition-colors"
                >
                  <button
                    onClick={() => setExpandedNewsId(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between px-[16px] py-[14px] text-left hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-primary)] pr-[var(--space-2)]">
                      {item.title}
                    </span>
                    <div className="text-[var(--text-muted)] shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--text-primary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-[16px] pb-[14px] pt-1 text-[var(--text-xs)] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-page)]/40 border-t border-[var(--border)]">
                      <p className="mb-2">
                        {item.summary ||
                          "Bitcoin fell amid macroeconomic liquidations and ETF outflows. Technical levels and crypto sentiment have turned cautious across major digital asset exchanges."}
                      </p>
                      <div className="flex items-center justify-between text-[var(--text-xs)] pt-1">
                        <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-[var(--weight-regular)]">
                          <span>{item.publisher}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.publishedAt)}</span>
                        </span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[var(--positive)] hover:underline transition-colors"
                          >
                            <span>Read full report</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Card>
      </div>
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
