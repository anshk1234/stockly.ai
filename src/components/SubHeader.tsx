"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MarketSentiment, DashboardTab } from "@/lib/types";

interface SubHeaderProps {
  region: "IN" | "US";
  onRegionChange: (region: "IN" | "US") => void;
  sentiment: MarketSentiment | null;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const TABS: DashboardTab[] = ["Crypto", "Predictions", "Watchlist"];

// Crisp vector flags to avoid Windows OS emoji font fallback rendering as "IN" / "US" text
function IndiaFlagIcon({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" rx="2" fill="#FFFFFF" />
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.8" fill="none" />
      <circle cx="12" cy="8" r="0.6" fill="#000080" />
    </svg>
  );
}

function USFlagIcon({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" rx="2" fill="#B22234" />
      <rect y="2.46" width="24" height="1.23" fill="#FFFFFF" />
      <rect y="4.92" width="24" height="1.23" fill="#FFFFFF" />
      <rect y="7.38" width="24" height="1.23" fill="#FFFFFF" />
      <rect y="9.84" width="24" height="1.23" fill="#FFFFFF" />
      <rect y="12.30" width="24" height="1.23" fill="#FFFFFF" />
      <rect width="10" height="8.6" fill="#3C3B6E" />
    </svg>
  );
}

export function SubHeader({
  region,
  onRegionChange,
  sentiment,
  activeTab,
  onTabChange,
}: SubHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="w-full border-b border-[var(--border)] bg-[var(--bg-page)]">
      <div className="w-full max-w-[var(--container-max)] mx-auto px-[var(--page-gutter)] py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Navigation Tabs and Market Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Region Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                onTabChange("Markets");
              }}
              className={`flex items-center gap-1.5 px-2 py-1 text-[13px] font-[var(--weight-medium)] rounded-md transition-colors ${
                activeTab === "Markets"
                  ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] pb-1 -mb-2"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {region === "IN" ? <IndiaFlagIcon /> : <USFlagIcon />}
              <span>{region === "IN" ? "India Markets" : "US Markets"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-44 rounded-[var(--radius-card)] bg-[var(--bg-card)] border border-[var(--border)] shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    onRegionChange("IN");
                    onTabChange("Markets");
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors ${
                    region === "IN" ? "text-[var(--positive)] font-[var(--weight-medium)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IndiaFlagIcon />
                    <span>India Markets</span>
                  </span>
                  {region === "IN" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)]"></span>}
                </button>
                <button
                  onClick={() => {
                    onRegionChange("US");
                    onTabChange("Markets");
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors ${
                    region === "US" ? "text-[var(--positive)] font-[var(--weight-medium)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <USFlagIcon />
                    <span>US Markets</span>
                  </span>
                  {region === "US" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)]"></span>}
                </button>
              </div>
            )}
          </div>

          <div className="h-3.5 w-[1px] bg-[var(--border)] mx-1 hidden sm:block"></div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 text-[13px] text-[var(--text-muted)]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap font-[var(--weight-medium)] ${
                    isActive
                      ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] pb-1 -mb-2"
                      : "hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sentiment & Market Status */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-[11.5px]">
          {/* Sentiment Bars */}
          <div className="flex items-center gap-1.5 text-[var(--positive)] font-[var(--weight-medium)]">
            <div className="flex items-center gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 h-2.5 rounded-full ${
                    i < (sentiment?.score ?? 7)
                      ? "bg-[var(--positive)]"
                      : "bg-[var(--bg-card-hover)]"
                  }`}
                />
              ))}
            </div>
            <span className="tracking-tight">
              {sentiment?.description || "Bullish Sentiment"}
            </span>
          </div>

          {/* Market Clock & Status (clean separator without stray bullet) */}
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sentiment?.marketOpen ? "bg-[var(--positive)]" : "bg-[var(--text-muted)]"
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
