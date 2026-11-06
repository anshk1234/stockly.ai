"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";

interface PredictionsViewProps {
  watchlist: AssetQuote[];
  isLoadingWatchlist: boolean;
  onOpenSearch: () => void;
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

const DETAILED_PREDICTIONS = [
  {
    id: "pred-card-1",
    title: "Largest Company end of December 2026?",
    volume: "$9.9M vol.",
    platform: "+5 on Polymarket",
    category: "Finance",
    options: [
      { label: "Apple", percentage: 63.0, change: 3.3 },
      { label: "NVIDIA", percentage: 37.0, change: -2.5 },
      { label: "Microsoft", percentage: 1.0, change: -1.1 },
    ],
    narrative:
      "NVIDIA leads at 59.5% to be the world's largest company by end of 2026, but Alphabet's recent 43% stock surge has meaningfully pressured that lead — with Alphabet climbing to 24% — making this a two-horse race worth watching, especially as NVIDIA's probability has already dropped from ~79% in early May, suggesting momentum is shifting toward Alphabet as a value play at current odds.",
    sources: "4 sources",
    date: "May 13, 2026",
  },
  {
    id: "pred-card-2",
    title: "Anthropic IPO Closing Market Cap",
    volume: "$3.7M vol.",
    platform: "+7 on Polymarket",
    category: "Tech",
    options: [
      { label: "$1.5–$1.75T", percentage: 29.0, change: 3.5 },
      { label: "$1.25–$1.5T", percentage: 19.0, change: 2.9 },
      { label: "$1.75–$2.0T", percentage: 18.0, change: -8.0 },
    ],
    narrative:
      "Anthropic's latest funding valuations and enterprise Claude revenue acceleration continue to drive bullish expectations for public market debut capitalization above the $1.5T benchmark threshold.",
    sources: "2 sources",
    date: "Oct 28, 2026",
  },
  {
    id: "pred-card-3",
    title: "What will WTI Crude Oil (WTI) hit in November 2026?",
    volume: "$1.4M vol.",
    platform: "+21 on Polymarket",
    category: "Economy",
    options: [
      { label: "↑ $95", percentage: 71.0, change: 12.5 },
      { label: "↓ $85", percentage: 68.0, change: -10.0 },
      { label: "↑ $100", percentage: 45.0, change: 9.0 },
    ],
    narrative:
      "Energy derivative markets price heightened volatility amidst Middle East supply dynamics and strategic petroleum reserve inventory restocking directives.",
    sources: "6 sources",
    date: "Nov 3, 2026",
  },
  {
    id: "pred-card-4",
    title: "Anthropic IPO by ___?",
    volume: "$2.1M vol.",
    platform: "+11 on Polymarket",
    category: "Tech",
    options: [
      { label: "December 31, 2026", percentage: 71.0, change: 20.3 },
      { label: "December 15, 2026", percentage: 65.0, change: 22.5 },
      { label: "November 30, 2026", percentage: 54.0, change: 29.0 },
    ],
    narrative:
      "S-1 filing timelines and investment banking syndicate structuring indicate a late Q4 liquidity window prior to fiscal year-end regulatory pauses.",
    sources: "3 sources",
    date: "Nov 5, 2026",
  },
];

const MARKET_MOVERS = {
  gainers: [
    { name: "M M Forgings Limited", symbol: "MMFL · BSE", price: "₹630.45", change: "+19.99%" },
    { name: "IKIO Technologies Limited", symbol: "IKIO · BSE", price: "₹195.30", change: "+12.66%" },
    { name: "Tata Teleservices (Maharashtra)", symbol: "TTML · BSE", price: "₹39.73", change: "+12.17%" },
  ],
  losers: [
    { name: "IndusInd Bank", symbol: "INDUSINDBK · NSE", price: "₹1,140.00", change: "-4.25%" },
    { name: "Titan Company", symbol: "TITAN · NSE", price: "₹3,180.50", change: "-3.10%" },
  ],
  active: [
    { name: "HDFC Bank Ltd", symbol: "HDFCBANK · NSE", price: "₹1,745.20", change: "+1.85%" },
    { name: "Reliance Industries", symbol: "RELIANCE · NSE", price: "₹1,328.00", change: "+1.20%" },
  ],
};

export function PredictionsView({
  watchlist,
  isLoadingWatchlist,
  onOpenSearch,
}: PredictionsViewProps) {
  const [selectedPill, setSelectedPill] = useState("Finance");
  const [searchQuery, setSearchQuery] = useState("");
  const [moverTab, setMoverTab] = useState<"gainers" | "losers" | "active">("gainers");
  const [popularCryptos, setPopularCryptos] = useState<AssetQuote[]>([]);

  useEffect(() => {
    fetch("/api/crypto")
      .then((r) => r.json())
      .then((d) => {
        if (d.popular) setPopularCryptos(d.popular);
      })
      .catch(console.error);
  }, []);

  const filteredCards = DETAILED_PREDICTIONS.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.narrative.toLowerCase().includes(searchQuery.toLowerCase());
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
                        <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-[var(--space-2)]">
                          <span className="font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                            {opt.percentage.toFixed(1)}%
                          </span>
                          <div
                            className={`flex items-center text-[var(--text-xs)] font-[var(--weight-medium)] tabular-nums ${
                              isPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-3 h-3 stroke-[2]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2]" />}
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

  const sidebarContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      <WatchlistWidget
        items={watchlist}
        isLoading={isLoadingWatchlist}
        onManageWatchlist={onOpenSearch}
      />

      {/* Gainers / Losers / Active Movers inside ONE card */}
      <div className="w-full">
        <SectionTitle>Market Movers</SectionTitle>

        <Card>
          <div className="flex items-center gap-[var(--space-3)] px-[16px] pt-[12px] pb-[8px] border-b border-[var(--border)] text-[var(--text-xs)]">
            {(["gainers", "losers", "active"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMoverTab(tab)}
                className={`capitalize font-[var(--weight-medium)] transition-colors ${
                  moverTab === tab
                    ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] pb-1 -mb-[9px]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col">
            {MARKET_MOVERS[moverTab].map((item, idx) => {
              const isPos = item.change.startsWith("+");
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-[16px] py-[12px] border-b border-[var(--border)] last:border-b-0 text-[var(--text-xs)]"
                >
                  <div>
                    <div className="font-[var(--weight-medium)] text-[var(--text-primary)] truncate max-w-[140px]">
                      {item.name}
                    </div>
                    <div className="text-[var(--text-xs)] text-[var(--text-muted)]">{item.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">{item.price}</div>
                    <div className={`text-[var(--text-xs)] font-[var(--weight-medium)] tabular-nums ${isPos ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                      {item.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Popular Cryptos inside ONE card */}
      <div className="w-full">
        <SectionTitle>Popular Cryptocurrencies</SectionTitle>

        <Card>
          {popularCryptos.map((coin) => {
            const isPos = coin.changePercent >= 0;
            return (
              <Link
                key={coin.symbol}
                href={`/stocks/${encodeURIComponent(coin.symbol)}`}
                className="flex items-center justify-between px-[16px] py-[12px] border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <div className="flex items-center gap-[var(--space-2)]">
                  <TickerLogo symbol={coin.symbol} name={coin.name} size={24} />
                  <div>
                    <div className="font-[var(--weight-medium)] text-[var(--text-primary)] text-[var(--text-xs)]">{coin.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{coin.symbol} · CRYPTO</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-[var(--weight-medium)] text-[var(--text-primary)] text-[var(--text-xs)] tabular-nums">
                    {formatPrice(coin.price, "USD")}
                  </div>
                  <div className={`text-[10px] font-[var(--weight-medium)] tabular-nums ${isPos ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                    {formatPercent(coin.changePercent)}
                  </div>
                </div>
              </Link>
            );
          })}
        </Card>
      </div>
    </div>
  );

  return <TwoColumnLayout main={mainContent} sidebar={sidebarContent} />;
}
