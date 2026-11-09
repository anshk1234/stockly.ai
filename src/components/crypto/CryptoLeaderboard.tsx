"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { CryptoLeaderboardItem } from "@/app/api/crypto/leaderboard/route";

function CoinbaseLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path
        d="M16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26C21.5228 26 26 21.5228 26 16C26 10.4772 21.5228 6 16 6ZM13.8 20.2C11.4804 20.2 9.6 18.3196 9.6 16C9.6 13.6804 11.4804 11.8 13.8 11.8C15.0284 11.8 16.1264 12.33 16.8848 13.1764L15.3468 14.7144C14.966 14.2884 14.4172 14.02 13.8 14.02C12.7076 14.02 11.82 14.9076 11.82 16C11.82 17.0924 12.7076 17.98 13.8 17.98C14.4172 17.98 14.966 17.7116 15.3468 17.2856L16.8848 18.8236C16.1264 19.67 15.0284 20.2 13.8 20.2Z"
        fill="white"
      />
    </svg>
  );
}

export function CryptoLeaderboard() {
  const router = useRouter();
  const [exchange, setExchange] = useState<"coinbase" | "all">("coinbase");
  const [items, setItems] = useState<CryptoLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    fetch(`/api/crypto/leaderboard?exchange=${exchange}`)
      .then((r) => r.json())
      .then((d) => {
        if (isCurrent && d.items) {
          setItems(d.items);
        }
      })
      .catch((err) => console.error("Leaderboard load failed:", err))
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [exchange]);

  return (
    <section className="w-full">
      {/* Header with Title, Subtitle, and Exchange Selector */}
      <div className="flex items-start justify-between mb-3 px-0.5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Leaderboard
          </h2>
          <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 font-normal">
            {exchange === "coinbase"
              ? "Data from spot transactions on Coinbase"
              : "Includes active coins with 100M+ market cap."}
          </p>
        </div>

        {/* Exchange Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-[11.5px] font-[var(--weight-medium)] text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#18191d] hover:bg-[#23252b] border border-white/10 transition-colors shadow-sm"
          >
            {exchange === "coinbase" && <CoinbaseLogo />}
            <span>{exchange === "coinbase" ? "Coinbase" : "All Exchanges"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#18191d] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setExchange("coinbase");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors ${
                  exchange === "coinbase"
                    ? "text-white font-[var(--weight-medium)] bg-white/[0.04]"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CoinbaseLogo />
                  <span>Coinbase</span>
                </span>
                {exchange === "coinbase" && <Check className="w-3.5 h-3.5 text-neutral-300" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setExchange("all");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors ${
                  exchange === "all"
                    ? "text-white font-[var(--weight-medium)] bg-white/[0.04]"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <span>All Exchanges</span>
                {exchange === "all" && <Check className="w-3.5 h-3.5 text-neutral-300" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-[#18191d] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[#131417]/80 text-[11px] font-medium text-[var(--text-muted)] select-none">
                <th className="py-2.5 px-4 font-medium min-w-[160px]">Asset</th>
                <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">
                  ▾ Vol 24H
                </th>
                {exchange === "coinbase" && (
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">
                    Vol Chg 24H
                  </th>
                )}
                <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">
                  Price
                </th>
                {exchange === "all" && (
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">
                    Market Cap
                  </th>
                )}
                <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">
                  Price Chg 24H
                </th>
                {exchange === "coinbase" && (
                  <th className="py-2.5 px-4 font-medium text-right whitespace-nowrap">
                    Funding Rate
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-[12.5px]">
              {isLoading && items.length === 0 ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#25272e]" />
                        <div className="space-y-1.5">
                          <div className="w-20 h-3 bg-[#25272e] rounded" />
                          <div className="w-12 h-2.5 bg-[#25272e] rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="w-16 h-3 bg-[#25272e] rounded ml-auto" />
                    </td>
                    {exchange === "coinbase" && (
                      <td className="py-3 px-3 text-right">
                        <div className="w-12 h-3 bg-[#25272e] rounded ml-auto" />
                      </td>
                    )}
                    <td className="py-3 px-3 text-right">
                      <div className="w-14 h-3 bg-[#25272e] rounded ml-auto" />
                    </td>
                    {exchange === "all" && (
                      <td className="py-3 px-3 text-right">
                        <div className="w-16 h-3 bg-[#25272e] rounded ml-auto" />
                      </td>
                    )}
                    <td className="py-3 px-3 text-right">
                      <div className="w-12 h-3 bg-[#25272e] rounded ml-auto" />
                    </td>
                    {exchange === "coinbase" && (
                      <td className="py-3 px-4 text-right">
                        <div className="w-10 h-3 bg-[#25272e] rounded ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                items.map((coin) => {
                  const isGain = coin.priceChg24H >= 0;
                  const isVolGain = (coin.volChg24H ?? 0) >= 0;

                  return (
                    <tr
                      key={coin.symbol}
                      className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                      onClick={() => (window.location.href = `/stocks/${encodeURIComponent(coin.symbol)}`)}
                    >
                      {/* Asset Column */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-[#22242a]">
                            <TickerLogo symbol={coin.symbol} name={coin.name} size={28} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                              {coin.name}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] tracking-tight">
                              {coin.displaySymbol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vol 24H */}
                      <td className="py-2.5 px-3 text-right tabular-nums text-white/90 font-medium whitespace-nowrap">
                        {coin.formattedVol24H}
                      </td>

                      {/* Vol Chg 24H (Coinbase only) */}
                      {exchange === "coinbase" && (
                        <td
                          className="py-2.5 px-3 text-right tabular-nums font-medium whitespace-nowrap text-[12px]"
                          style={{ color: isVolGain ? "#3ecf8e" : "#f2555a" }}
                        >
                          {isVolGain ? "+" : ""}
                          {(coin.volChg24H ?? 0).toFixed(2)}%
                        </td>
                      )}

                      {/* Price */}
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium text-white whitespace-nowrap">
                        {coin.formattedPrice}
                      </td>

                      {/* Market Cap (All Exchanges only) */}
                      {exchange === "all" && (
                        <td className="py-2.5 px-3 text-right tabular-nums text-white/90 font-medium whitespace-nowrap">
                          {coin.formattedMarketCap}
                        </td>
                      )}

                      {/* Price Chg 24H */}
                      <td
                        className="py-2.5 px-3 text-right tabular-nums font-medium whitespace-nowrap text-[12px]"
                        style={{ color: isGain ? "#3ecf8e" : "#f2555a" }}
                      >
                        {isGain ? "+" : ""}
                        {coin.priceChg24H.toFixed(2)}%
                      </td>

                      {/* Funding Rate (Coinbase only) */}
                      {exchange === "coinbase" && (
                        <td className="py-2.5 px-4 text-right tabular-nums text-neutral-400 whitespace-nowrap text-[11.5px]">
                          {coin.fundingRate}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
