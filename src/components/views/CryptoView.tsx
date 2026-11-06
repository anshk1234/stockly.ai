"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Clock, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { AssetQuote, NewsItem } from "@/lib/types";
import { formatPrice, formatPercent, formatChange, formatTimeAgo } from "@/lib/utils";
import { SparklineChart } from "@/components/SparklineChart";
import { WatchlistWidget } from "@/components/WatchlistWidget";

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Crypto Movements & Market Summary */}
      <section className="lg:col-span-8 flex flex-col">
        {/* Top Crypto Movement Strip */}
        <div className="w-full mb-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Crypto Movement</h2>
            {isLoading && <RefreshCw className="w-3 h-3 text-[#6D717B] animate-spin" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cryptoMovements.map((coin) => {
              const isPositive = coin.changePercent >= 0;
              return (
                <Link
                  key={coin.symbol}
                  href={`/stocks/${encodeURIComponent(coin.symbol)}`}
                  className="group relative flex flex-col justify-between bg-[#1B1C20] hover:bg-[#202227] border border-[#26282E] hover:border-[#33363E] rounded-xl p-3.5 transition-all duration-150 shadow-sm cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-medium text-[#989BA3] truncate mb-1 group-hover:text-emerald-400 transition-colors">
                      {coin.name}
                    </div>
                    <div className="flex items-baseline justify-between gap-1.5">
                      <div className="text-base sm:text-[17px] font-semibold text-white tracking-tight tabular-nums">
                        {formatPrice(coin.price, "USD")}
                      </div>

                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.2]" />
                        )}
                        <span>{formatPercent(coin.changePercent)}</span>
                        <span className="text-[10px] text-[#717580] ml-0.5">
                          {formatChange(coin.change, "USD")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 w-full h-11">
                    <SparklineChart
                      data={coin.sparkline}
                      isPositive={isPositive}
                      height={44}
                      width={220}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Crypto Market Summary */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Market Summary</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-[#717580]">
              <Clock className="w-3 h-3" />
              <span>{lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Fetching updates..."}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {cryptoNews.map((item, index) => {
              const isExpanded = expandedNewsId === item.id || (!expandedNewsId && index === 0);

              return (
                <div
                  key={item.id}
                  className="bg-[#1B1C20] border border-[#26282E] rounded-xl transition-all duration-150 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedNewsId(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-[#202227] transition-colors"
                  >
                    <span className="text-xs font-medium text-[#EDEDEE] hover:text-white transition-colors pr-2">
                      {item.title}
                    </span>
                    <div className="text-[#6D717B] shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#A1A4AC]" /> : <ChevronDown className="w-4 h-4 text-[#6D717B]" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-[#23252A] text-xs text-[#989BA3] leading-relaxed bg-[#16171B]">
                      <p className="mb-2.5">
                        {item.summary ||
                          "Bitcoin fell amid macroeconomic liquidations and ETF outflows. Technical levels and crypto sentiment have turned cautious across major digital asset exchanges."}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#6D717B] pt-1">
                        <span className="flex items-center gap-1.5 font-medium text-[#8E929B]">
                          <span>{item.publisher}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.publishedAt)}</span>
                        </span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:underline hover:text-emerald-300 transition-colors"
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
            })}
          </div>
        </div>
      </section>

      {/* Right Column: Watchlist & Crypto Predictions */}
      <aside className="lg:col-span-4 flex flex-col">
        <WatchlistWidget
          items={watchlist}
          isLoading={isLoadingWatchlist}
          onManageWatchlist={onOpenSearch}
        />

        {/* Crypto Prediction Markets */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Prediction Markets</h2>
          </div>

          <div className="flex flex-col gap-3">
            {CRYPTO_PREDICTIONS.map((card) => (
              <div
                key={card.id}
                className="p-3.5 rounded-xl bg-[#1B1C20] border border-[#26282E] hover:border-[#33363E] transition-all"
              >
                <div className="text-xs font-semibold text-[#EDEDEE] mb-2 leading-snug">
                  {card.title}
                </div>

                <div className="flex flex-col gap-1.5 mb-2.5">
                  {card.options.map((opt, i) => {
                    const isPositive = opt.change >= 0;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-[#989BA3] font-medium text-[11px]">{opt.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white font-mono tabular-nums text-[11px]">
                            {opt.percentage.toFixed(1)}%
                          </span>
                          <div
                            className={`flex items-center text-[10px] font-medium font-mono tabular-nums ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-3 h-3 stroke-[2.2]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />}
                            <span>{Math.abs(opt.change).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#717580] pt-2 border-t border-[#23252A]">
                  <span>{card.volume}</span>
                  <span className="text-[#8E929B] hover:text-white transition-colors cursor-pointer">
                    {card.platform}
                  </span>
                </div>
              </div>
            ))}

            <button className="w-full py-2 text-center text-xs text-[#8E929B] hover:text-white rounded-xl bg-[#1B1C20] border border-[#26282E] transition-colors">
              See 7 more
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
