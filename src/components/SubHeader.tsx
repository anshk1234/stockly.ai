"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { MarketSentiment, DashboardTab } from "@/lib/types";

interface SubHeaderProps {
  region: "IN" | "US";
  onRegionChange: (region: "IN" | "US") => void;
  sentiment: MarketSentiment | null;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const TABS: DashboardTab[] = ["Crypto", "Predictions", "Watchlist"];

// Crisp vector flags avoiding OS emoji font fallback
export function IndiaFlagIcon({ className = "w-4 h-3" }: { className?: string }) {
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

export function USFlagIcon({ className = "w-4 h-3" }: { className?: string }) {
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

  const handleSelectRegion = (newRegion: "IN" | "US") => {
    onRegionChange(newRegion);
    onTabChange("Markets");
    setDropdownOpen(false);
  };

  return (
    <div className="w-full border-b border-[var(--border)] bg-[var(--bg-page)] relative z-30">
      <div className="w-full max-w-[var(--container-max)] mx-auto px-[var(--page-gutter)] py-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs and Market Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Primary Market Dropdown (1:1 Perplexity Finance) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((prev) => !prev);
                if (activeTab !== "Markets") {
                  onTabChange("Markets");
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-[var(--weight-medium)] rounded-md transition-colors ${
                activeTab === "Markets"
                  ? "text-[var(--text-primary)] border-b-2 border-white pb-1 -mb-[5px]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {region === "IN" ? <IndiaFlagIcon /> : <USFlagIcon />}
              <span>{region === "IN" ? "India Markets" : "US Markets"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2.5 w-48 rounded-xl bg-[#18191d] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Option: US Markets */}
                <button
                  type="button"
                  onClick={() => handleSelectRegion("US")}
                  className={`w-full text-left px-3 py-2 text-[12.5px] rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors ${
                    region === "US"
                      ? "text-white font-[var(--weight-medium)] bg-white/[0.04]"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <USFlagIcon />
                    <span>US Markets</span>
                  </span>
                  {region === "US" && <Check className="w-3.5 h-3.5 text-neutral-300" />}
                </button>

                {/* Option: India Markets */}
                <button
                  type="button"
                  onClick={() => handleSelectRegion("IN")}
                  className={`w-full text-left px-3 py-2 text-[12.5px] rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors ${
                    region === "IN"
                      ? "text-white font-[var(--weight-medium)] bg-white/[0.04]"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <IndiaFlagIcon />
                    <span>India Markets</span>
                  </span>
                  {region === "IN" && <Check className="w-3.5 h-3.5 text-neutral-300" />}
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
                      ? "text-[var(--text-primary)] border-b-2 border-white pb-1 -mb-[5px]"
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
            <span>{sentiment?.status ?? "Upbeat"} Sentiment</span>
          </div>

          <span className="text-[var(--border)]">•</span>

          {/* Live Market Clock */}
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sentiment?.marketOpen ?? true
                  ? "bg-[var(--positive)] animate-pulse"
                  : "bg-neutral-500"
              }`}
            />
            <span>
              {sentiment?.marketOpen ?? true ? "Markets Open" : "Markets Closed"}
            </span>
            <span>•</span>
            <span className="tabular-nums">
              {sentiment?.marketTimeIST ||
                new Date().toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }) + ", IST"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
