"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { DetailedStockQuote } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";

interface CompanyProfileWidgetProps {
  stock: DetailedStockQuote;
}

export function CompanyProfileWidget({ stock }: CompanyProfileWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCrypto = stock.assetClass === "CRYPTOCURRENCY" || stock.symbol.endsWith("-USD");
  const isIndex = stock.assetClass === "INDEX" || stock.symbol.startsWith("^");

  let profileRows: { label: string; value: string }[] = [];

  if (isCrypto) {
    const coinCode = stock.symbol.split("-")[0];
    profileRows = [
      { label: "Symbol", value: stock.symbol },
      { label: "Asset Class", value: "Cryptocurrency / Digital Asset" },
      { label: "Genesis Launch", value: stock.genesisDate || "N/A" },
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
          : "Unlimited / Dynamic",
      },
      { label: "Sector", value: stock.sector || "Digital Asset" },
      { label: "Jurisdiction", value: stock.country || "Global / Decentralized" },
      { label: "Market", value: stock.exchange || "Global Crypto Spot" },
    ];
  } else if (isIndex) {
    profileRows = [
      { label: "Symbol", value: stock.symbol },
      { label: "Asset Class", value: "Benchmark Market Index" },
      {
        label: "Constituents",
        value: stock.constituentsCount ? `${stock.constituentsCount} Large-Cap Equities` : "Top Blue-Chip Equities",
      },
      { label: "Currency", value: stock.currency || "INR" },
      { label: "Host Exchange", value: stock.exchange || "NSE" },
      { label: "Country", value: stock.country || "India" },
      { label: "Index Classification", value: "Broad Market Equity Benchmark" },
      { label: "Market State", value: stock.marketState || "Regular Session" },
    ];
  } else {
    // Standard Corporate Equity
    profileRows = [
      { label: "Symbol", value: stock.symbol },
      { label: "IPO Date", value: stock.ipoDate || "N/A" },
      { label: "CEO", value: stock.ceo || "N/A" },
      {
        label: "Fulltime Employees",
        value: stock.fullTimeEmployees ? formatCompactNumber(stock.fullTimeEmployees) : "N/A",
      },
      { label: "Sector", value: stock.sector || "N/A" },
      { label: "Industry", value: stock.industry || "N/A" },
      { label: "Country", value: stock.country || "N/A" },
      { label: "Exchange", value: stock.exchange || "N/A" },
    ];
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)] w-full">
      {/* Profile Card */}
      <div className="w-full">
        <SectionTitle>{isCrypto ? "About Crypto Asset" : isIndex ? "About Benchmark Index" : "About Company"}</SectionTitle>

        <Card>
          <div className="flex flex-col">
            {profileRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-[16px] py-[12px] border-b border-[var(--border)] text-[var(--text-xs)]"
              >
                <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">{row.label}</span>
                <span className="text-[var(--text-primary)] font-[var(--weight-medium)] text-right truncate max-w-[190px]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Asset Description Summary */}
          {stock.summary && (
            <div className="p-[16px] text-[var(--text-xs)] leading-relaxed text-[var(--text-muted)] border-t border-[var(--border)]">
              <p className={isExpanded ? "" : "line-clamp-4"}>
                {stock.summary}
              </p>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-[var(--text-primary)] hover:underline flex items-center gap-1 font-[var(--weight-medium)] transition-colors cursor-pointer"
              >
                <span>{isExpanded ? "View Less" : "View More"}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Analyst Consensus Card (Shown ONLY for Equities that have actual Wall Street Coverage) */}
      {!isCrypto && !isIndex && stock.analystRating && (
        <div className="w-full">
          <SectionTitle
            action={
              <button className="flex items-center text-[var(--text-xs)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-[var(--weight-regular)]">
                <span>See all</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            }
          >
            Analyst Consensus
          </SectionTitle>

          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--positive)]" />
                <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--positive)]">
                  {stock.analystRating}
                </span>
              </div>

              <span className="text-[var(--text-xs)] text-[var(--text-muted)] font-[var(--weight-regular)]">
                Wall Street Consensus
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
