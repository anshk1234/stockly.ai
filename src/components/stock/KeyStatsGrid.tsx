"use client";

import React from "react";
import { DetailedStockQuote } from "@/lib/types";
import { formatCompactNumber, formatPercent } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";

interface KeyStatsGridProps {
  stock: DetailedStockQuote;
  attached?: boolean;
}

export function KeyStatsGrid({ stock, attached = true }: KeyStatsGridProps) {
  const currencySymbol = stock.currency === "INR" ? "₹" : "$";
  const isCrypto = stock.assetClass === "CRYPTOCURRENCY" || stock.symbol.endsWith("-USD");
  const isIndex = stock.assetClass === "INDEX" || stock.symbol.startsWith("^");
  const coinCode = stock.symbol.split("-")[0];

  let stats: { label: string; value: string }[] = [];

  if (isCrypto) {
    stats = [
      {
        label: "Market Cap",
        value: formatCompactNumber(stock.marketCap, currencySymbol),
      },
      {
        label: "24h Volume",
        value: formatCompactNumber(stock.volume24Hr || stock.volume, currencySymbol),
      },
      {
        label: "Circulating Supply",
        value: stock.circulatingSupply
          ? `${formatCompactNumber(stock.circulatingSupply)} ${coinCode}`
          : "—",
      },
      {
        label: "Max Supply",
        value: stock.maxSupply
          ? `${formatCompactNumber(stock.maxSupply)} ${coinCode}`
          : "Unlimited",
      },
      {
        label: "Day Range",
        value:
          stock.dayLow && stock.dayHigh
            ? `${currencySymbol}${stock.dayLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.dayHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—",
      },
      {
        label: "52W Range",
        value:
          stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
            ? `${currencySymbol}${stock.fiftyTwoWeekLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.fiftyTwoWeekHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—",
      },
      {
        label: "50-Day Moving Avg",
        value: stock.fiftyDayAverage
          ? `${currencySymbol}${stock.fiftyDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "—",
      },
      {
        label: "200-Day Moving Avg",
        value: stock.twoHundredDayAverage
          ? `${currencySymbol}${stock.twoHundredDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "—",
      },
      {
        label: "Market State",
        value: stock.marketState || "24/7 Live",
      },
    ];
  } else if (isIndex) {
    stats = [
      {
        label: "Day Range",
        value:
          stock.dayLow && stock.dayHigh
            ? `${currencySymbol}${stock.dayLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.dayHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—",
      },
      {
        label: "52W Range",
        value:
          stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
            ? `${currencySymbol}${stock.fiftyTwoWeekLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.fiftyTwoWeekHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—",
      },
      {
        label: "Previous Close",
        value: `${currencySymbol}${(stock.previousClose || stock.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      },
      {
        label: "50-Day Moving Avg",
        value: stock.fiftyDayAverage
          ? `${currencySymbol}${stock.fiftyDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "—",
      },
      {
        label: "200-Day Moving Avg",
        value: stock.twoHundredDayAverage
          ? `${currencySymbol}${stock.twoHundredDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "—",
      },
      {
        label: "Constituents",
        value: stock.constituentsCount ? `${stock.constituentsCount} Companies` : "50 Large-Cap",
      },
      {
        label: "Index Exchange",
        value: stock.exchange || "NSE",
      },
      {
        label: "Market Currency",
        value: `${stock.currency || "INR"} (${currencySymbol})`,
      },
      {
        label: "Market State",
        value: stock.marketState || "Regular",
      },
    ];
  } else {
    // Standard Equities (matching Perplexity Finance layout from User Image 3)
    const openPrice = stock.price && stock.change !== undefined ? stock.price - stock.change : undefined;

    stats = [
      {
        label: "Forward P/E",
        value: stock.forwardPE ? stock.forwardPE.toFixed(2) : "—",
      },
      {
        label: "Market Cap",
        value: formatCompactNumber(stock.marketCap, currencySymbol),
      },
      {
        label: "Open",
        value: openPrice ? `${currencySymbol}${openPrice.toFixed(2)}` : "—",
      },
      {
        label: "Trailing P/E",
        value: stock.trailingPE ? stock.trailingPE.toFixed(2) : "—",
      },
      {
        label: "Day Range",
        value:
          stock.dayLow && stock.dayHigh
            ? `${currencySymbol}${stock.dayLow.toFixed(2)} - ${currencySymbol}${stock.dayHigh.toFixed(2)}`
            : "—",
      },
      {
        label: "Dividend Yield",
        value: stock.dividendYield ? formatPercent(stock.dividendYield * 100) : "—",
      },
      {
        label: "52W Range",
        value:
          stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
            ? `${currencySymbol}${stock.fiftyTwoWeekLow.toFixed(2)} - ${currencySymbol}${stock.fiftyTwoWeekHigh.toFixed(2)}`
            : "—",
      },
      {
        label: "EPS",
        value: stock.eps ? `${currencySymbol}${stock.eps.toFixed(2)}` : "—",
      },
      {
        label: "Volume",
        value: formatCompactNumber(stock.volume),
      },
    ];
  }

  if (attached) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 px-4 sm:px-5 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-b-0"
            >
              <span className="text-[12px] text-neutral-400 font-normal">
                {stat.label}
              </span>
              <span className="text-[13px] font-medium text-white tabular-nums text-right ml-2">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-[var(--space-2)]">
      <SectionTitle>Key Statistics</SectionTitle>
      <Card className="p-[18px]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-[var(--space-4)] gap-x-[var(--space-5)]">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[var(--text-xs)] font-[var(--weight-regular)] text-[var(--text-muted)] mb-1">
                {stat.label}
              </span>
              <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
