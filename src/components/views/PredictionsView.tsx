"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { MarketMoversWidget } from "@/components/MarketMoversWidget";
import { TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { PredictionMarketItem, FALLBACK_PREDICTIONS } from "@/lib/polymarket";

interface PredictionsViewProps {
  watchlist: AssetQuote[];
  isLoadingWatchlist: boolean;
  onOpenSearch: () => void;
  region?: "IN" | "US";
}

const CATEGORY_PILLS = [
  "Finance",
  "Crypto",
  "Politics",
  "Culture",
  "Tech",
  "Economy",
  "Geopolitics",
  "Earnings",
  "World",
];


export function PredictionsView({
  watchlist,
  isLoadingWatchlist,
  onOpenSearch,
  region = "IN",
}: PredictionsViewProps) {
  const [selectedPill, setSelectedPill] = useState("Finance");
  const [searchQuery, setSearchQuery] = useState("");
  const [popularCryptos, setPopularCryptos] = useState<AssetQuote[]>([]);
  const [predictionCards, setPredictionCards] = useState<PredictionMarketItem[]>(FALLBACK_PREDICTIONS);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  // In-memory client cache for instant (0ms) category switching
  const cacheRef = useRef<Record<string, { markets: PredictionMarketItem[]; timestamp: number }>>({});

  useEffect(() => {
    fetch("/api/crypto")
      .then((r) => r.json())
      .then((d) => {
        if (d.popular) setPopularCryptos(d.popular);
      })
      .catch(console.error);
  }, []);

  // Fetch live prediction markets whenever selected category changes
  useEffect(() => {
    let isCurrent = true;

    async function loadCategoryMarkets() {
      const cached = cacheRef.current[selectedPill];
      const now = Date.now();
      if (cached && now - cached.timestamp < 120000) {
        setPredictionCards(cached.markets);
        return;
      }

      setIsLoadingPredictions(true);
      try {
        const res = await fetch(`/api/predictions?category=${encodeURIComponent(selectedPill)}`);
        const data = await res.json();
        if (isCurrent && data.markets && Array.isArray(data.markets) && data.markets.length > 0) {
          cacheRef.current[selectedPill] = {
            markets: data.markets,
            timestamp: Date.now(),
          };
          setPredictionCards(data.markets);
        }
      } catch (err) {
        console.warn(`Failed to fetch ${selectedPill} prediction markets:`, err);
      } finally {
        if (isCurrent) setIsLoadingPredictions(false);
      }
    }

    loadCategoryMarkets();
    return () => {
      isCurrent = false;
    };
  }, [selectedPill]);

  const filteredCards = predictionCards.filter((card) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const matchesSearch =
      card.title.toLowerCase().includes(query) ||
      (card.narrative && card.narrative.toLowerCase().includes(query)) ||
      card.options.some((opt) => opt.label.toLowerCase().includes(query));
    return matchesSearch;
  });

  const mainContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div>
        <SectionTitle>Prediction Markets</SectionTitle>

        {/* Search prediction markets input */}
        <div className="relative mb-[var(--space-3)]">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prediction markets..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-card)] pl-9 pr-3.5 py-1.5 text-[var(--text-xs)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-muted)]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-[var(--space-2)] overflow-x-auto no-scrollbar py-0.5 mb-[var(--space-4)]">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = selectedPill === pill;
            return (
              <button
                key={pill}
                onClick={() => setSelectedPill(pill)}
                className={`px-2.5 py-1 rounded-[var(--radius-card)] text-[var(--text-xs)] font-[var(--weight-medium)] transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* 2x2 Grid of Detailed Prediction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-3)]">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="p-[16px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-[var(--space-3)]">
                  <div className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-primary)] leading-snug">
                    {card.title}
                  </div>
                  <span className="text-[var(--text-xs)] text-[var(--text-muted)] shrink-0 font-[var(--weight-regular)]">
                    {card.volume}
                  </span>
                </div>

                <div className="flex flex-col gap-[var(--space-2)] mb-[var(--space-3)]">
                  {card.options.map((opt, i) => {
                    const isPositive = opt.change >= 0;
                    return (
                      <div key={i} className="flex items-center justify-between text-[var(--text-xs)]">
                        <span className="text-[var(--text-muted)] font-[var(--weight-regular)] truncate max-w-[180px]">
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-[var(--space-2)] shrink-0">
                          <span className="font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                            {opt.percentage.toFixed(1)}%
                          </span>
                          <div
                            className={`flex items-center gap-0.5 text-[var(--text-xs)] font-[var(--weight-medium)] tabular-nums`}
                            style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 stroke-[2]" />
                            )}
                            <span>{Math.abs(opt.change).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[var(--text-xs)] text-[var(--text-muted)] leading-relaxed pt-2 border-t border-[var(--border)] mb-[var(--space-3)]">
                  {card.narrative}
                </p>
              </div>

              <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                <span>{card.sources} • {card.date}</span>
                <a
                  href="https://polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-[var(--weight-medium)]"
                >
                  {card.platform}
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      {/* Watchlist Quick Widget */}
      <WatchlistWidget
        items={watchlist}
        isLoading={isLoadingWatchlist}
        onManageWatchlist={onOpenSearch}
      />

      <MarketMoversWidget region={region} />

      {/* Popular Cryptos Sidebar Strip */}
      {popularCryptos.length > 0 && (
        <div>
          <SectionTitle>Popular Cryptocurrencies</SectionTitle>
          <div className="flex flex-col gap-2">
            {popularCryptos.slice(0, 4).map((coin) => {
              const isPositive = coin.changePercent >= 0;
              return (
                <Link
                  key={coin.symbol}
                  href={`/stocks/${encodeURIComponent(coin.symbol)}`}
                  className="flex items-center justify-between p-2.5 rounded-[var(--radius-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TickerLogo symbol={coin.symbol} name={coin.name} size={20} />
                    <div>
                      <div className="text-[12px] font-[var(--weight-medium)] text-[var(--text-primary)]">
                        {coin.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase">
                        {coin.symbol.replace("-USD", "")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                      {formatPrice(coin.price, "USD")}
                    </div>
                    <div
                      className={`text-[10px] font-[var(--weight-medium)] tabular-nums`}
                      style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                    >
                      {formatPercent(coin.changePercent)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return <TwoColumnLayout main={mainContent} sidebar={sidebarContent} />;
}
