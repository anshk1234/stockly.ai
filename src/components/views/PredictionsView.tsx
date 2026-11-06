"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { WatchlistWidget } from "@/components/WatchlistWidget";

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Predictions Search & 2x2 Grid */}
      <section className="lg:col-span-8 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight mb-2.5">
            Prediction Markets
          </h2>

          {/* Search prediction markets input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-[#6D717B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prediction markets..."
              className="w-full bg-[#1B1C20] border border-[#26282E] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-[#6D717B] focus:outline-none focus:border-[#353840]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = selectedPill === pill;
              return (
                <button
                  key={pill}
                  onClick={() => setSelectedPill(pill)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#252830] text-white"
                      : "text-[#8E929B] hover:text-white hover:bg-[#1E1F24]"
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Detailed Prediction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl bg-[#1B1C20] border border-[#26282E] hover:border-[#33363E] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row with volume */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="text-xs font-semibold text-[#EDEDEE] leading-snug">
                    {card.title}
                  </div>
                  <span className="text-[10px] text-[#717580] shrink-0 font-mono">
                    {card.volume}
                  </span>
                </div>

                {/* Probability Rows */}
                <div className="flex flex-col gap-1.5 mb-3">
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

                {/* Analytical Narrative Paragraph */}
                <p className="text-[11px] text-[#8E929B] leading-relaxed pt-2 border-t border-[#23252A] mb-3">
                  {card.narrative}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[10px] text-[#6D717B] pt-2 border-t border-[#23252A]">
                <span>{card.sources} • {card.date}</span>
                <span className="text-[#8E929B] hover:text-white transition-colors cursor-pointer">
                  {card.platform}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Column: Watchlist, Gainers/Losers, and Popular Cryptos */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        <WatchlistWidget
          items={watchlist}
          isLoading={isLoadingWatchlist}
          onManageWatchlist={onOpenSearch}
        />

        {/* Gainers / Losers / Active Movers */}
        <div className="rounded-xl bg-[#1B1C20] border border-[#26282E] p-3.5">
          <div className="flex items-center gap-3 border-b border-[#23252A] pb-2 mb-3 text-xs">
            {(["gainers", "losers", "active"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMoverTab(tab)}
                className={`capitalize font-medium transition-colors ${
                  moverTab === tab
                    ? "text-white border-b border-white pb-2 -mb-2.5"
                    : "text-[#717580] hover:text-[#989BA3]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col divide-y divide-[#23252A]">
            {MARKET_MOVERS[moverTab].map((item, idx) => {
              const isPos = item.change.startsWith("+");
              return (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div>
                    <div className="font-medium text-white truncate max-w-[140px]">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#717580] font-mono">{item.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white font-mono tabular-nums">{item.price}</div>
                    <div className={`text-[10px] font-medium font-mono tabular-nums ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="w-full text-center text-[11px] text-[#8E929B] hover:text-white pt-2.5 border-t border-[#23252A] mt-2 transition-colors">
            See all &gt;
          </button>
        </div>

        {/* Popular Cryptocurrencies */}
        <div className="rounded-xl bg-[#1B1C20] border border-[#26282E] p-3.5">
          <div className="text-xs font-semibold text-[#EDEDEE] mb-3">
            Popular Cryptocurrencies
          </div>

          <div className="flex flex-col divide-y divide-[#23252A]">
            {popularCryptos.map((coin) => {
              const isPos = coin.changePercent >= 0;
              return (
                <Link
                  key={coin.symbol}
                  href={`/stocks/${encodeURIComponent(coin.symbol)}`}
                  className="flex items-center justify-between py-2 text-xs hover:bg-[#202227] px-1 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#24262C] flex items-center justify-center font-bold text-[10px] text-emerald-400">
                      {coin.shortName?.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{coin.name}</div>
                      <div className="text-[10px] text-[#717580] font-mono">{coin.symbol} · CRYPTO</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-white font-mono tabular-nums">
                      {formatPrice(coin.price, "USD")}
                    </div>
                    <div className={`text-[10px] font-medium font-mono tabular-nums ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatPercent(coin.changePercent)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
