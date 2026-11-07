"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { SearchResult, TrendingSearchAsset } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { TickerLogo } from "@/components/ui/TickerLogo";


interface SearchDropdownProps {
  className?: string;
  onSelectSymbol?: (symbol: string) => void;
}

export function SearchDropdown({ className, onSelectSymbol }: SearchDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState<{ symbol: string; name: string }[]>([
    { symbol: "GOOG", name: "Alphabet Inc. GOOG" },
    { symbol: "AAPL", name: "Apple Inc. AAPL" },
    { symbol: "NVDA", name: "NVIDIA Corporation NVDA" },
    { symbol: "BTC-USD", name: "Grayscale Bitcoin Mini T... BTC" },
  ]);
  const [trending, setTrending] = useState<TrendingSearchAsset[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recommendations once on mount or when opened
  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await fetch("/api/search");
        const data = await res.json();
        if (data.trending && data.trending.length > 0) {
          setTrending(data.trending);
        }
        if (data.recent && data.recent.length > 0) {
          setRecent(data.recent);
        }
      } catch (err) {
        console.error("Failed to load search recommendations:", err);
      }
    }
    loadRecommendations();
  }, []);

  // Click outside listener to close dropdown cleanly without any page blur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced Live Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (sym: string) => {
    // Record to recent searches
    try {
      const stored = JSON.parse(localStorage.getItem("stockly_recent_searches") || "[]");
      const updated = [sym, ...stored.filter((s: string) => s !== sym)].slice(0, 6);
      localStorage.setItem("stockly_recent_searches", JSON.stringify(updated));
    } catch {}

    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    onSelectSymbol?.(sym);
    router.push(`/stocks/${encodeURIComponent(sym)}`);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxLen = query.trim() ? results.length : trending.length;
      if (maxLen > 0) {
        setSelectedIndex((prev) => (prev + 1) % maxLen);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const maxLen = query.trim() ? results.length : trending.length;
      if (maxLen > 0) {
        setSelectedIndex((prev) => (prev - 1 + maxLen) % maxLen);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) {
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex].symbol);
        } else if (results.length > 0) {
          handleSelect(results[0].symbol);
        } else {
          handleSelect(query.trim());
        }
      } else if (selectedIndex >= 0 && trending[selectedIndex]) {
        handleSelect(trending[selectedIndex].symbol);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className || ""}`}>
      {/* Search Input Box */}
      <div
        className={`w-full flex items-center justify-between px-3.5 py-1.5 text-[12.5px] bg-[var(--bg-card)] border rounded-[var(--radius-card)] transition-colors shadow-sm ${
          isOpen ? "border-[var(--positive)]/40 ring-1 ring-[var(--positive)]/30" : "border-[var(--border)] hover:border-white/20"
        }`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder="Search for stocks, crypto, and more..."
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none text-[12.5px]"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-[var(--positive)] animate-spin" />}
          {query ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] border border-[var(--border)] rounded">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Popover Recommendations Dropdown (NO FULL-SCREEN BLUR!) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#17181C] border border-[var(--border)] rounded-[var(--radius-card)] shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* View 1: When user types query, show live search results */}
          {query.trim().length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {results.length === 0 && !isLoading ? (
                <div className="px-4 py-8 text-center text-[var(--text-xs)] text-[var(--text-muted)]">
                  No stocks or crypto matching &ldquo;{query}&rdquo;
                </div>
              ) : (
                results.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={item.symbol + idx}
                      onClick={() => handleSelect(item.symbol)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
                          : "hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TickerLogo symbol={item.symbol} name={item.longname || item.shortname} size={24} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-[var(--weight-medium)] text-[13px] text-[var(--text-primary)]">
                              {item.symbol}
                            </span>
                            {item.quoteType && (
                              <span className="text-[10px] text-[var(--text-muted)] bg-white/5 px-1 rounded">
                                {item.quoteType}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate">
                            {item.longname || item.shortname || item.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-[var(--text-muted)] shrink-0 ml-2">
                        {item.exchange || "NASDAQ"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* View 2: When input is empty, show Recent pills + Trending list */
            <div className="p-3">
              {/* Section 1: Recent Pills */}
              <div className="mb-3">
                <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] mb-2 px-1">
                  Recent
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((rec) => (
                    <button
                      key={rec.symbol}
                      onClick={() => handleSelect(rec.symbol)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[11.5px] text-[var(--text-primary)] transition-colors cursor-pointer group"
                    >
                      <TickerLogo symbol={rec.symbol} size={15} />
                      <span className="truncate max-w-[180px]">{rec.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Trending List */}
              <div>
                <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] mb-1.5 px-1">
                  Trending
                </div>
                <div className="flex flex-col gap-0.5">
                  {(trending.length > 0 ? trending : [
                    { symbol: "TITN", name: "Titan Machinery Inc.", exchange: "NASDAQ", price: 21.24, change: -1.28, changePercent: -5.68, currency: "USD", country: "US" },
                    { symbol: "HCI", name: "HCI Group, Inc.", exchange: "NYSE", price: 192.03, change: -10.5, changePercent: -5.18, currency: "USD", country: "US" },
                    { symbol: "TPCS", name: "TechPrecision Corporation", exchange: "NASDAQ", price: 5.02, change: -0.29, changePercent: -5.46, currency: "USD", country: "US" },
                    { symbol: "GDYN", name: "Grid Dynamics Holdings, Inc.", exchange: "NASDAQ", price: 13.54, change: -0.21, changePercent: -1.56, currency: "USD", country: "US" },
                    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", price: 181.60, change: -23.04, changePercent: -11.26, currency: "USD", country: "US" },
                  ]).map((asset, idx) => {
                    const isPositive = asset.changePercent >= 0;
                    const isSelected = selectedIndex === idx;

                    return (
                      <div
                        key={asset.symbol}
                        onClick={() => handleSelect(asset.symbol)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
                            : "hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        {/* Left: Brand Avatar & Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TickerLogo symbol={asset.symbol} name={asset.name} size={24} />
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)] truncate">
                              {asset.name}
                            </div>
                            <div className="text-[10.5px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                              <span>{asset.symbol}</span>
                              <span>·</span>
                              <span>{asset.exchange}</span>
                              <span>·</span>
                              <span>🇺🇸</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Price & Percent & Arrow */}
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="text-right">
                            <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                              {formatPrice(asset.price, asset.currency, asset.symbol)}
                            </div>
                            <div
                              className={`flex items-center justify-end gap-0.5 text-[11px] font-[var(--weight-medium)] tabular-nums ${isPositive ? "text-positive" : "text-negative"}`} style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
                              )}
                              <span>{formatPercent(asset.changePercent, false)}</span>
                            </div>
                          </div>

                          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
