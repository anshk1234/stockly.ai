"use client";

import React from "react";
import { DetailedStockQuote } from "@/lib/types";
import { formatCompactNumber, formatPercent } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";

interface KeyStatsGridProps {
  stock: DetailedStockQuote;
}

export function KeyStatsGrid({ stock }: KeyStatsGridProps) {
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
          : "N/A",
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
            : "N/A",
      },
      {
        label: "52W Range",
        value:
          stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
            ? `${currencySymbol}${stock.fiftyTwoWeekLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.fiftyTwoWeekHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "N/A",
      },
      {
        label: "50-Day Moving Avg",
        value: stock.fiftyDayAverage
          ? `${currencySymbol}${stock.fiftyDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "N/A",
      },
      {
        label: "200-Day Moving Avg",
        value: stock.twoHundredDayAverage
          ? `${currencySymbol}${stock.twoHundredDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "N/A",
      },
    ];
  } else if (isIndex) {
    stats = [
      {
        label: "Day Range",
        value:
          stock.dayLow && stock.dayHigh
            ? `${currencySymbol}${stock.dayLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.dayHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "N/A",
      },
      {
        label: "52W Range",
        value:
          stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
            ? `${currencySymbol}${stock.fiftyTwoWeekLow.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${currencySymbol}${stock.fiftyTwoWeekHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "N/A",
      },
      {
        label: "Previous Close",
        value: `${currencySymbol}${(stock.previousClose || stock.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      },
      {
        label: "50-Day Moving Avg",
        value: stock.fiftyDayAverage
          ? `${currencySymbol}${stock.fiftyDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "N/A",
      },
      {
        label: "200-Day Moving Avg",
        value: stock.twoHundredDayAverage
          ? `${currencySymbol}${stock.twoHundredDayAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "N/A",
      },
      {
        label: "Constituents",
        value: stock.constituentsCount ? `${stock.constituentsCount} Companies` : "Blue-Chips",
      },
      {
        label: "Index Exchange",
        value: stock.exchange || "NSE",
      },
      {
        label: "Market Currency",
        value: `${stock.currency || "INR"} (${currencySymbol})`,
      },
    ];
  } else {
    // Standard Equities
    stats = [
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
