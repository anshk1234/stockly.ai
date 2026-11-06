"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight, TrendingUp } from "lucide-react";
import { SearchResult } from "@/lib/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

export function SearchModal({ isOpen, onClose, onSelectSymbol }: SearchModalProps) {
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

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // handled by parent state toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#10141E] border border-[#222A3C] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1C2333]">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols (e.g. RELIANCE, NIFTY, AAPL, BTC)..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#1A202E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results area */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && !isLoading ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              {query.trim()
                ? "No symbols found for this search."
                : "Type to search stocks, crypto, indices from Yahoo Finance."}
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={`${item.symbol}-${idx}`}
                onClick={() => {
                  onSelectSymbol?.(item.symbol);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#161D2B] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#182030] flex items-center justify-center text-emerald-400 text-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {item.symbol}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate max-w-sm">
                      {item.shortname || item.longname || item.symbol}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1C2436] text-neutral-400">
                    {item.exchange || "EXCHANGE"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
