"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Plus, GripVertical } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TickerLogo } from "@/components/ui/TickerLogo";

interface SearchSuggestion {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export function ManageWatchlistModal() {
  const {
    isManageWatchlistOpen,
    closeManageWatchlist,
    savedSymbols,
    toggleWatchlist,
  } = useApp();

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeManageWatchlist();
    }
    if (isManageWatchlistOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isManageWatchlistOpen, closeManageWatchlist]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            setSuggestions(
              data.results.slice(0, 6).map((r: { symbol: string; name: string; exchange?: string }) => ({
                symbol: r.symbol,
                name: r.name,
                exchange: r.exchange,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  if (!isManageWatchlistOpen) return null;

  const handleAdd = async (item: SearchSuggestion) => {
    await toggleWatchlist(item.symbol, item.name);
    setQuery("");
    setSuggestions([]);
  };

  const handleRemove = async (symbol: string) => {
    await toggleWatchlist(symbol);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="relative w-full max-w-[460px] rounded-2xl bg-[#141518] border border-white/10 shadow-2xl p-6 text-left animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-semibold text-white tracking-tight">Finance</h2>
            <p className="text-[12.5px] text-neutral-400 mt-1">
              Set your watchlist for daily updates and summaries
            </p>
          </div>
          <button
            onClick={closeManageWatchlist}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="relative mb-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            autoFocus
            className="w-full bg-[#1c1d22] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-neutral-500 outline-none transition-colors"
          />

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#1a1b20] border border-white/10 rounded-xl shadow-2xl p-1.5 z-30 max-h-56 overflow-y-auto divide-y divide-white/5">
              {suggestions.map((s) => {
                const isAlreadyAdded = savedSymbols.includes(s.symbol.toUpperCase());
                return (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <TickerLogo symbol={s.symbol} name={s.name} size={24} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-white truncate">{s.name}</div>
                        <div className="text-[10.5px] text-neutral-400 truncate">{s.symbol}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAdd(s)}
                      className={`p-1.5 rounded-lg text-[12px] font-medium transition-all ${
                        isAlreadyAdded
                          ? "text-neutral-500 cursor-not-allowed"
                          : "text-neutral-300 hover:text-white hover:bg-white/10"
                      }`}
                      title={isAlreadyAdded ? "Already in watchlist" : "Add to watchlist"}
                    >
                      {isAlreadyAdded ? (
                        <span className="text-[11px] text-neutral-500">Added</span>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {isSearching && (
            <div className="absolute right-3 top-3 text-[11px] text-neutral-500">Searching...</div>
          )}
        </div>

        {/* Current Watchlist Items */}
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {savedSymbols.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-neutral-500">
              No tickers in your watchlist yet. Use the search bar above to add one.
            </div>
          ) : (
            savedSymbols.map((sym) => (
              <div
                key={sym}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <GripVertical className="w-3.5 h-3.5 text-neutral-600 shrink-0 cursor-grab" />
                  <TickerLogo symbol={sym} size={24} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-white tracking-tight">{sym}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(sym)}
                  className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
                  title={`Remove ${sym}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-5 mt-4 border-t border-white/5">
          <button
            type="button"
            onClick={closeManageWatchlist}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-[12.5px] transition-all shadow-md active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
