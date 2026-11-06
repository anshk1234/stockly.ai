"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight, TrendingUp } from "lucide-react";
import { SearchResult } from "@/lib/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

export function SearchModal({ isOpen, onClose, onSelectSymbol }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (sym: string) => {
    onSelectSymbol?.(sym);
    onClose();
    router.push(`/stocks/${encodeURIComponent(sym)}`);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      const firstResult = results[0]?.symbol || query.trim();
      handleSelect(firstResult);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/25 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[var(--radius-card)] bg-[#17181C] border border-[var(--border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)]">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Search for stocks, crypto, and more..."
            className="w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-[var(--positive)] animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length > 0 ? (
            results.length === 0 && !isLoading ? (
              <div className="py-8 text-center text-[12px] text-[var(--text-muted)]">
                No symbols found matching &ldquo;{query}&rdquo;
              </div>
            ) : (
              results.map((item, idx) => (
                <div
                  key={`${item.symbol}-${idx}`}
                  onClick={() => handleSelect(item.symbol)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--positive)] text-[10px] font-bold shrink-0">
                      {item.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] group-hover:text-[var(--positive)] transition-colors">
                        {item.symbol}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate max-w-sm">
                        {item.shortname || item.longname || item.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-muted)] font-[var(--weight-medium)]">
                      {item.exchange || "NASDAQ"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="p-2">
              <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] mb-2">
                Recent
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { symbol: "GOOG", name: "Alphabet Inc. GOOG" },
                  { symbol: "AAPL", name: "Apple Inc. AAPL" },
                  { symbol: "NVDA", name: "NVIDIA Corporation NVDA" },
                  { symbol: "BTC-USD", name: "Bitcoin BTC" },
                ].map((rec) => (
                  <button
                    key={rec.symbol}
                    onClick={() => handleSelect(rec.symbol)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[11.5px] text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <span>{rec.name}</span>
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] mb-1.5">
                Trending
              </div>
              <div className="flex flex-col gap-0.5">
                {[
                  { symbol: "TITN", name: "Titan Machinery Inc.", exchange: "NASDAQ", price: "$21.24", change: "-5.68%" },
                  { symbol: "HCI", name: "HCI Group, Inc.", exchange: "NYSE", price: "$192.03", change: "-5.18%" },
                  { symbol: "TPCS", name: "TechPrecision Corporation", exchange: "NASDAQ", price: "$5.02", change: "-5.46%" },
                  { symbol: "GDYN", name: "Grid Dynamics Holdings, Inc.", exchange: "NASDAQ", price: "$13.54", change: "-1.56%" },
                ].map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => handleSelect(item.symbol)}
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)]">{item.name}</div>
                      <div className="text-[10.5px] text-[var(--text-muted)]">{item.symbol} · {item.exchange} · 🇺🇸</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12.5px] font-[var(--weight-medium)] text-[var(--text-primary)]">{item.price}</div>
                      <div className="text-[11px] text-[var(--negative)]">{item.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
