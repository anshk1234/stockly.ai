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
  TrendingUp,
  History,
} from "lucide-react";
import { SearchResult, TrendingSearchAsset } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { TickerLogo } from "@/components/ui/TickerLogo";

// Vector brand icons for Recent items
function GoogleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AppleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.89-14.23-6.74-10.22-12.01-21.78-15.82-34.68-3.81-12.9-5.72-24.89-5.72-35.97 0-14.46 3.7-26.65 11.1-36.56 7.4-9.92 16.73-14.96 27.99-15.13 4.9.11 10.33 1.33 16.29 3.65 5.96 2.33 10.16 3.55 12.61 3.65 1.95 0 6.35-1.39 13.19-4.17 6.84-2.77 12.67-3.95 17.51-3.53 13.48 1.1 24.32 6.3 32.53 15.62-11.75 7.07-17.51 16.85-17.29 29.35.22 9.79 3.96 17.94 11.22 24.46 4.13 3.69 8.86 6.3 14.19 7.82-2.18 6.42-4.79 12.83-7.85 19.23zm-30.82-114.9c0 7.39-2.71 14.39-8.14 21-5.43 6.62-12.07 10.74-19.92 12.37-.22-1.09-.33-2.17-.33-3.26 0-7.18 2.82-14.33 8.47-21.46 5.66-7.13 12.44-11.23 20.35-12.31.22 1.2.33 2.37.33 3.52z" />
    </svg>
  );
}

function NvidiaIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#76B900] rounded-[2px] flex items-center justify-center font-black text-[9px] text-black leading-none`}>
      n
    </div>
  );
}

function BitcoinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#F7931A] rounded-full flex items-center justify-center font-bold text-[9px] text-white leading-none`}>
      ₿
    </div>
  );
}

function getBrandIcon(symbol: string) {
  if (symbol.includes("GOOG")) return <GoogleIcon />;
  if (symbol.includes("AAPL")) return <AppleIcon className="text-white w-3 h-3" />;
  if (symbol.includes("NVDA")) return <NvidiaIcon />;
  if (symbol.includes("BTC")) return <BitcoinIcon />;
  return (
    <div className="w-3.5 h-3.5 rounded bg-[var(--bg-card-hover)] text-[9px] font-bold text-[var(--text-muted)] flex items-center justify-center">
      {symbol.slice(0, 1)}
    </div>
  );
}

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
                              className={`flex items-center justify-end gap-0.5 text-[11px] font-[var(--weight-medium)] tabular-nums ${
                                isPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"
                              }`}
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
