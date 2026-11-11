"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatPrice } from "@/lib/utils";

interface SearchSuggestion {
  symbol: string;
  name: string;
  price?: number;
  currency?: string;
}

export function PriceAlertModal() {
  const { isAlertModalOpen, alertInitialAsset, closeAlertModal, isGuest, openAuthModal, refreshAlerts } = useApp();

  const [symbol, setSymbol] = useState("NVDA");
  const [assetName, setAssetName] = useState("NVIDIA Corporation");
  const [currentPrice, setCurrentPrice] = useState(178.67);
  const [currency, setCurrency] = useState("USD");

  const [criteria, setCriteria] = useState<"target" | "movement">("target");
  const [targetPrice, setTargetPrice] = useState("187.6");
  const [movementPercent, setMovementPercent] = useState("5.0");

  // Notifications
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifNone, setNotifNone] = useState(false);

  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Search autocomplete
  const [query, setQuery] = useState("");
  const [_isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize modal state when opened
  useEffect(() => {
    if (isAlertModalOpen) {
      if (alertInitialAsset) {
        setSymbol(alertInitialAsset.symbol);
        setAssetName(alertInitialAsset.name || alertInitialAsset.symbol);
        const p = alertInitialAsset.price || 100;
        setCurrentPrice(p);
        setCurrency(alertInitialAsset.currency || "USD");
        // Default target is +5% higher
        setTargetPrice((p * 1.05).toFixed(2));
        setQuery(alertInitialAsset.symbol);
      } else {
        setQuery(symbol);
      }
    }
  }, [isAlertModalOpen, alertInitialAsset, symbol]);

  // Live ticker search
  useEffect(() => {
    if (!query || query === symbol) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setSuggestions(
            data.results.slice(0, 5).map((r: { symbol: string; name: string }) => ({
              symbol: r.symbol,
              name: r.name,
            }))
          );
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, symbol]);

  const selectAsset = async (item: SearchSuggestion) => {
    setSymbol(item.symbol);
    setAssetName(item.name);
    setQuery(item.symbol);
    setSuggestions([]);

    // Fetch live quote for the selected asset
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(item.symbol)}`);
      const data = await res.json();
      if (data.stock) {
        const p = data.stock.price || 100;
        setCurrentPrice(p);
        setCurrency(data.stock.currency || "USD");
        setTargetPrice((p * 1.05).toFixed(2));
      }
    } catch {
      // fallback
    }
  };

  // Notification text computation
  const getNotifSummary = () => {
    if (notifNone) return "No notifications";
    const active = [];
    if (notifInApp) active.push("In-app");
    if (notifEmail) active.push("Email");
    if (notifPush) active.push("Push");
    if (active.length === 0) return "No notifications";
    if (active.length === 1) return active[0];
    if (active.length === 2) return `${active[0]} and ${active[1]}`;
    return `${active[0]}, ${active[1]}, and ${active[2]}`;
  };

  // Dynamic Query Explanation
  const defaultQueryText = `Explain the factors driving the latest movement of ${symbol} (${assetName}), including its recent rise/fall to $${targetPrice}. Contextualize this price movement within the last few weeks of price movement and investor narrative.`;

  const handleSave = async () => {
    if (isGuest) {
      // If user is not logged in, prompt sign in
      closeAlertModal();
      openAuthModal("alert");
      return;
    }

    try {
      const channels: string[] = [];
      if (notifNone) {
        channels.push("none");
      } else {
        if (notifInApp) channels.push("in_app");
        if (notifEmail) channels.push("email");
        if (notifPush) channels.push("push");
      }

      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          criteria: criteria === "target" ? "TARGET_PRICE" : "MOVEMENT_AMOUNT",
          targetPrice: criteria === "target" ? parseFloat(targetPrice) : undefined,
          movementPct: criteria === "movement" ? parseFloat(movementPercent) : undefined,
          channels,
          defaultQuery: defaultQueryText,
          additionalInstructions: additionalInstructions || undefined,
        }),
      });
      await refreshAlerts();
    } catch (err) {
      console.error("Failed to save price alert to D1:", err);
    }

    closeAlertModal();
  };

  if (!isAlertModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[480px] rounded-2xl bg-[#141518] border border-white/10 shadow-2xl p-6 text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h2 className="text-[16px] font-semibold text-white tracking-tight">Price alert</h2>
          <button
            onClick={closeAlertModal}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* 1. Ticker Search Input */}
          <div className="relative">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
              Find a stock, token, or fund...
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="e.g. NVDA, AAPL, BTC-USD..."
              className="w-full bg-[#1c1d22] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-[13px] text-white placeholder-neutral-500 outline-none transition-colors"
            />

            {/* Suggestions Popover */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1b20] border border-white/10 rounded-xl shadow-2xl p-1 z-30">
                {suggestions.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => selectAsset(s)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-white text-[12px]">{s.symbol}</span>
                      <span className="text-[11px] text-neutral-400 ml-2 truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Alert Criteria: Target Price vs Movement Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-neutral-400">Alert criteria</label>
              <span className="text-[11px] text-neutral-400">
                Target Price (currently {formatPrice(currentPrice, currency, symbol)})
              </span>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
              {/* Toggle Buttons */}
              <div className="flex items-center bg-[#1c1d22] p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setCriteria("target")}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors ${
                    criteria === "target"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Target Price
                </button>
                <button
                  type="button"
                  onClick={() => setCriteria("movement")}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors ${
                    criteria === "movement"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Movement Amount
                </button>
              </div>

              {/* Price / Percent Input */}
              {criteria === "target" ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[13px]">$</span>
                  <input
                    type="text"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full bg-[#1c1d22] border border-white/10 focus:border-white/30 rounded-xl pl-6 pr-3.5 py-1.5 text-[13px] text-white outline-none font-mono transition-colors"
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={movementPercent}
                    onChange={(e) => setMovementPercent(e.target.value)}
                    className="w-full bg-[#1c1d22] border border-white/10 focus:border-white/30 rounded-xl pl-3.5 pr-6 py-1.5 text-[13px] text-white outline-none font-mono transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[13px]">%</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Notifications Dropdown */}
          <div className="relative">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Notifications</label>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-full flex items-center justify-between bg-[#1c1d22] hover:bg-[#23242a] border border-white/10 rounded-xl px-3.5 py-2 text-[12.5px] text-white transition-colors"
            >
              <span>{getNotifSummary()}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isNotifOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Options */}
            {isNotifOpen && (
              <div className="mt-1 bg-[#1a1b20] border border-white/10 rounded-xl shadow-2xl p-2 space-y-1 z-30">
                {/* In-app */}
                <label className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-[12px] text-neutral-200">
                  <span>In-app</span>
                  <input
                    type="checkbox"
                    checked={notifInApp && !notifNone}
                    disabled={notifNone}
                    onChange={(e) => setNotifInApp(e.target.checked)}
                    className="accent-white w-3.5 h-3.5 rounded"
                  />
                </label>

                {/* Email */}
                <label className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-[12px] text-neutral-200">
                  <span>Email</span>
                  <input
                    type="checkbox"
                    checked={notifEmail && !notifNone}
                    disabled={notifNone}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="accent-white w-3.5 h-3.5 rounded"
                  />
                </label>

                {/* Push */}
                <label className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-[12px] text-neutral-200">
                  <span>Push</span>
                  <input
                    type="checkbox"
                    checked={notifPush && !notifNone}
                    disabled={notifNone}
                    onChange={(e) => setNotifPush(e.target.checked)}
                    className="accent-white w-3.5 h-3.5 rounded"
                  />
                </label>

                <div className="border-t border-white/5 pt-1 mt-1">
                  {/* No notifications */}
                  <label className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-[12px] text-neutral-400">
                    <span>No notifications</span>
                    <input
                      type="checkbox"
                      checked={notifNone}
                      onChange={(e) => setNotifNone(e.target.checked)}
                      className="accent-white w-3.5 h-3.5 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 4. Default Query Preview Box */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Default query</label>
            <div className="bg-[#18191d] border border-white/5 rounded-xl p-3 text-[11.5px] leading-relaxed text-neutral-300 select-none">
              {defaultQueryText}
            </div>
          </div>

          {/* 5. Additional Instructions (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
              Additional Instructions (optional)
            </label>
            <textarea
              rows={2}
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Check news and social media sentiment to assess consensus or controversy"
              className="w-full bg-[#1c1d22] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-[12px] text-white placeholder-neutral-500 outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-white/5">
          <button
            type="button"
            onClick={closeAlertModal}
            className="px-4 py-2 rounded-xl text-[12.5px] font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-[12.5px] transition-all shadow-md active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
