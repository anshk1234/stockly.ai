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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#1B1C20] border border-[#282A2F] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#26282E]">
          <Search className="w-4 h-4 text-[#6D717B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Search symbols (e.g. NVDA, AAPL, RELIANCE.NS, BTC-USD)..."
            className="w-full bg-transparent text-sm text-white placeholder-[#6D717B] focus:outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-[#8E929B] animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8E929B] hover:text-white hover:bg-[#24262C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results area */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && !isLoading ? (
            <div className="py-8 text-center text-xs text-[#6D717B]">
              {query.trim()
                ? "No symbols found for this search."
                : "Type to search stocks, crypto, indices from Yahoo Finance."}
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={`${item.symbol}-${idx}`}
                onClick={() => handleSelect(item.symbol)}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#22242A] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#24262C] flex items-center justify-center text-emerald-400 text-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {item.symbol}
                    </div>
                    <div className="text-[11px] text-[#8E929B] truncate max-w-sm">
                      {item.shortname || item.longname || item.symbol}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#24262C] text-[#8E929B]">
                    {item.exchange || "EXCHANGE"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#545762] group-hover:text-[#A1A4AC] transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
