"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight, Globe, Building2, User } from "lucide-react";
import { DetailedStockQuote } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";

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
    <div className="flex flex-col gap-5 w-full">
      {/* Profile Card */}
      <div className="rounded-2xl bg-[#11151F] border border-[#1C2230] p-4 sm:p-5 shadow-sm">
        {/* Key Info Rows */}
        <div className="flex flex-col divide-y divide-[#181D2A] mb-4 text-xs">
          {profileRows.map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-neutral-400 font-medium">{row.label}</span>
              <span className="text-white font-semibold text-right truncate max-w-[190px]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Business Summary Description */}
        {stock.summary && (
          <div className="pt-3 border-t border-[#181D2A] text-xs leading-relaxed text-neutral-300">
            <p className={isExpanded ? "" : "line-clamp-4"}>
              {stock.summary}
            </p>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-neutral-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <span>{isExpanded ? "View Less" : "View More"}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Analyst Consensus Card */}
      <div className="rounded-2xl bg-[#11151F] border border-[#1C2230] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Analyst Consensus</h3>
          <button className="flex items-center text-xs text-neutral-400 hover:text-white transition-colors">
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#161B26] border border-[#1E2536]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">
              {stock.analystRating || "Strong Buy"}
            </span>
          </div>

          <span className="text-xs text-neutral-400 font-mono">
            Rating: {stock.analystRating || "1.7 / 5"}
          </span>
        </div>
      </div>
    </div>
  );
}
