"use client";

import React from "react";
import { DetailedStockQuote } from "@/lib/types";
import { formatCompactNumber, formatPercent } from "@/lib/utils";

interface KeyStatsGridProps {
  stock: DetailedStockQuote;
}

export function KeyStatsGrid({ stock }: KeyStatsGridProps) {
  const currencySymbol = stock.currency === "INR" ? "₹" : "$";

  const stats = [
    {
      label: "Forward P/E",
      value: stock.forwardPE ? stock.forwardPE.toFixed(2) : "N/A",
    },
    {
      label: "Market Cap",
      value: formatCompactNumber(stock.marketCap, currencySymbol),
    },
    {
      label: "Trailing P/E",
      value: stock.trailingPE ? stock.trailingPE.toFixed(2) : "N/A",
    },
    {
      label: "Day Range",
      value:
        stock.dayLow && stock.dayHigh
          ? `${currencySymbol}${stock.dayLow.toFixed(2)} - ${currencySymbol}${stock.dayHigh.toFixed(2)}`
          : "N/A",
    },
    {
      label: "Dividend Yield",
      value: stock.dividendYield ? formatPercent(stock.dividendYield * 100) : "0.00%",
    },
    {
      label: "52W Range",
      value:
        stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
          ? `${currencySymbol}${stock.fiftyTwoWeekLow.toFixed(2)} - ${currencySymbol}${stock.fiftyTwoWeekHigh.toFixed(2)}`
          : "N/A",
    },
    {
      label: "EPS",
      value: stock.eps ? `${currencySymbol}${stock.eps.toFixed(2)}` : "N/A",
    },
    {
      label: "Volume",
      value: formatCompactNumber(stock.volume),
    },
  ];

  return (
    <div className="w-full mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--border)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-[var(--space-3)] gap-x-[var(--space-4)]">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[var(--text-xs)] font-[var(--weight-regular)] text-[var(--text-muted)] mb-0.5">
              {stat.label}
            </span>
            <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
