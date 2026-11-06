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
    <div className="w-full border-b border-[#23252A] bg-[#141517] px-4 lg:px-6 py-2">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 overflow-x-auto no-scrollbar">
        {/* Navigation Tabs and Market Selector */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Region Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#EDEDEE] hover:bg-[#1E1F24] rounded-md transition-colors border-b border-white pb-1.5 -mb-2"
            >
              <span>{region === "IN" ? "🇮🇳 India Markets" : "🇺🇸 US Markets"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E929B]" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-3 w-44 rounded-xl bg-[#1B1C20] border border-[#2B2D34] shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    onRegionChange("IN");
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#23252B] transition-colors ${
                    region === "IN" ? "text-emerald-400 font-medium" : "text-[#A1A4AC]"
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
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#23252B] transition-colors ${
                    region === "US" ? "text-emerald-400 font-medium" : "text-[#A1A4AC]"
                  }`}
                >
                  <span>🇺🇸 US Markets</span>
                  {region === "US" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
              </div>
            )}
          </div>

          <div className="h-3.5 w-[1px] bg-[#2B2D33] mx-1.5 hidden sm:block"></div>

          {/* Secondary Filter Tabs */}
          <div className="flex items-center gap-1 text-xs text-[#8E929B]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`px-2 py-1 rounded-md hover:text-[#EDEDEE] transition-colors whitespace-nowrap ${
                    isActive ? "text-[#EDEDEE] font-medium bg-[#1E1F24]" : ""
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sentiment & Market Status */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto text-xs">
          {/* Sentiment Bars */}
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <div className="flex items-center gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 h-2.5 rounded-full ${
                    i < (sentiment?.score ?? 7)
                      ? "bg-emerald-400"
                      : "bg-[#282A30]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] tracking-tight">
              {sentiment?.description || "Upbeat Sentiment"}
            </span>
          </div>

          <span className="text-[#3A3D46]">•</span>

          {/* Market Clock & Status */}
          <div className="flex items-center gap-1.5 text-[#7F838D] text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sentiment?.marketOpen ? "bg-emerald-400" : "bg-[#545762]"
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
