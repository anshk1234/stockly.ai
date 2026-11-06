"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MarketSentiment } from "@/lib/types";

interface SubHeaderProps {
  region: "IN" | "US";
  onRegionChange: (region: "IN" | "US") => void;
  sentiment: MarketSentiment | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  "Crypto",
  "Earnings",
  "Predictions",
  "Screener",
  "Watchlist",
  "Workflows",
  "App Gallery",
];

export function SubHeader({
  region,
  onRegionChange,
  sentiment,
  activeTab,
  onTabChange,
}: SubHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="w-full border-b border-[#1A202C] bg-[#0A0D14]/70 px-4 lg:px-8 py-2.5">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Navigation Tabs and Market Selector */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Region Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:bg-[#161B26] transition-colors border-b-2 border-white pb-2 -mb-2.5"
            >
              <span>{region === "IN" ? "🇮🇳 India Markets" : "🇺🇸 US Markets"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-3 w-44 rounded-xl bg-[#121622] border border-[#222838] shadow-2xl py-1.5 z-50">
                <button
                  onClick={() => {
                    onRegionChange("IN");
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#1A202F] transition-colors ${
                    region === "IN" ? "text-emerald-400 font-semibold" : "text-neutral-300"
                  }`}
                >
                  <span>🇮🇳 India Markets</span>
                  {region === "IN" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
                <button
                  onClick={() => {
                    onRegionChange("US");
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#1A202F] transition-colors ${
                    region === "US" ? "text-emerald-400 font-semibold" : "text-neutral-300"
                  }`}
                >
                  <span>🇺🇸 US Markets</span>
                  {region === "US" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 mx-2 hidden sm:block"></div>

          {/* Secondary Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-neutral-400 font-normal">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`px-2.5 py-1.5 rounded-md hover:text-neutral-200 transition-colors whitespace-nowrap ${
                    isActive ? "text-white font-medium bg-[#161B26]" : ""
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sentiment & Market Status */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-xs">
          {/* Sentiment Bars */}
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <div className="flex items-center gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 h-3 rounded-full ${
                    i < (sentiment?.score ?? 7)
                      ? "bg-emerald-400"
                      : "bg-emerald-950"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] tracking-tight">
              {sentiment?.description || "Upbeat Sentiment"}
            </span>
          </div>

          <span className="text-neutral-600">•</span>

          {/* Market Clock & Status */}
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sentiment?.marketOpen ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
              }`}
            />
            <span>
              {sentiment?.marketOpen ? "Markets Open" : "Markets Closed"} · {sentiment?.marketTimeIST || "IST"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
