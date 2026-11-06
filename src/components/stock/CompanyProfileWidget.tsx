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

  const profileRows = [
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

  return (
    <div className="flex flex-col gap-[var(--space-6)] w-full">
      {/* Profile Card */}
      <div className="w-full">
        <SectionTitle>About</SectionTitle>

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

          {/* Business Summary Description */}
          {stock.summary && (
            <div className="p-[16px] text-[var(--text-xs)] leading-relaxed text-[var(--text-muted)] border-t border-[var(--border)]">
              <p className={isExpanded ? "" : "line-clamp-4"}>
                {stock.summary}
              </p>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-[var(--text-primary)] hover:underline flex items-center gap-1 font-[var(--weight-medium)] transition-colors"
              >
                <span>{isExpanded ? "View Less" : "View More"}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Analyst Consensus Card */}
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
                {stock.analystRating || "Strong Buy"}
              </span>
            </div>

            <span className="text-[var(--text-xs)] text-[var(--text-muted)] font-[var(--weight-regular)]">
              Rating: {stock.analystRating || "1.7 / 5"}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
