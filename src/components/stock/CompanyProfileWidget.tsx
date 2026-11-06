"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
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
    <div className="flex flex-col gap-4 w-full">
      {/* Profile Card */}
      <div className="rounded-2xl bg-[#1B1C20] border border-[#26282E] p-4 sm:p-5 shadow-sm">
        {/* Key Info Rows */}
        <div className="flex flex-col divide-y divide-[#23252A] mb-3 text-xs">
          {profileRows.map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-[#8E929B] font-medium">{row.label}</span>
              <span className="text-white font-medium text-right truncate max-w-[190px]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Business Summary Description */}
        {stock.summary && (
          <div className="pt-3 border-t border-[#23252A] text-xs leading-relaxed text-[#989BA3]">
            <p className={isExpanded ? "" : "line-clamp-4"}>
              {stock.summary}
            </p>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-[#8E929B] hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <span>{isExpanded ? "View Less" : "View More"}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Analyst Consensus Card */}
      <div className="rounded-2xl bg-[#1B1C20] border border-[#26282E] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-[#EDEDEE]">Analyst Consensus</h3>
          <button className="flex items-center text-[11px] text-[#717580] hover:text-white transition-colors">
            <span>See all</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#202227] border border-[#282A30]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {stock.analystRating || "Strong Buy"}
            </span>
          </div>

          <span className="text-xs text-[#8E929B] font-mono">
            Rating: {stock.analystRating || "1.7 / 5"}
          </span>
        </div>
      </div>
    </div>
  );
}
