"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { MarketMoverItem, MarketMoversData } from "@/lib/yahoo";

interface MarketMoversWidgetProps {
  region?: "IN" | "US";
}

// Module-level client cache
const moversCache: Record<string, { data: MarketMoversData; timestamp: number }> = {};

export function MarketMoversWidget({ region = "IN" }: MarketMoversWidgetProps) {
  const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "active">("gainers");
  const [moversData, setMoversData] = useState<MarketMoversData>(() => {
    return (
      moversCache[region]?.data || {
        gainers: [
          { name: "ICICI Bank", symbol: "ICICIBANK · NSE", cleanSymbol: "ICICIBANK.NS", price: "₹1,571.20", change: "+4.75%", isGain: true },
          { name: "HDFC Bank", symbol: "HDFCBANK · NSE", cleanSymbol: "HDFCBANK.NS", price: "₹788.25", change: "+3.72%", isGain: true },
          { name: "Titan Company", symbol: "TITAN · NSE", cleanSymbol: "TITAN.NS", price: "₹5,000.00", change: "+3.42%", isGain: true },
        ],
        losers: [
          { name: "Tata Power", symbol: "TATAPOWER · NSE", cleanSymbol: "TATAPOWER.NS", price: "₹352.50", change: "-3.31%", isGain: false },
          { name: "Vedanta Limited", symbol: "VEDL · NSE", cleanSymbol: "VEDL.NS", price: "₹261.75", change: "-0.78%", isGain: false },
          { name: "Power Grid Corp", symbol: "POWERGRID · NSE", cleanSymbol: "POWERGRID.NS", price: "₹259.90", change: "-0.48%", isGain: false },
        ],
        active: [
          { name: "HDFC Bank", symbol: "HDFCBANK · NSE", cleanSymbol: "HDFCBANK.NS", price: "₹788.25", change: "+3.72%", isGain: true },
          { name: "ICICI Bank", symbol: "ICICIBANK · NSE", cleanSymbol: "ICICIBANK.NS", price: "₹1,571.20", change: "+4.75%", isGain: true },
          { name: "Kotak Mahindra Bank", symbol: "KOTAKBANK · NSE", cleanSymbol: "KOTAKBANK.NS", price: "₹480.00", change: "+2.78%", isGain: true },
        ],
      }
    );
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadMovers() {
      const cached = moversCache[region];
      const now = Date.now();
      if (cached && now - cached.timestamp < 60000) {
        setMoversData(cached.data);
        return;
      }

      try {
        const res = await fetch(`/api/movers?region=${region}`);
        const data: MarketMoversData = await res.json();
        if (isCurrent && data.gainers) {
          moversCache[region] = { data, timestamp: Date.now() };
          setMoversData(data);
        }
      } catch (err) {
        console.warn("Failed to load market movers:", err);
      }
    }

    loadMovers();
    return () => {
      isCurrent = false;
    };
  }, [region]);

  const items: MarketMoverItem[] = moversData[activeTab] || [];

  return (
    <div className="w-full">
      <SectionTitle>Market Movers</SectionTitle>

      <Card className="p-[var(--space-3)]">
        {/* Tab Buttons (Gainers / Losers / Active) - High-contrast segmented pill */}
        <div className="flex items-center gap-1 bg-[#131416] p-1 rounded-lg border border-white/5 mb-3.5">
          {(["gainers", "losers", "active"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[11.5px] font-[var(--weight-medium)] capitalize rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-[#282a30] text-white shadow-sm border border-white/10 font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Stock List */}
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {items.map((item, idx) => (
            <Link
              key={idx}
              href={`/stocks/${encodeURIComponent(item.cleanSymbol)}`}
              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between group hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <TickerLogo symbol={item.cleanSymbol} name={item.name} size={28} />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)] group-hover:text-[var(--positive)] transition-colors truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {item.symbol}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                  {item.price}
                </div>
                <div
                  className="text-[11px] font-[var(--weight-medium)] tabular-nums"
                  style={{ color: item.isGain ? "#3ecf8e" : "#f2555a" }}
                >
                  {item.change}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
