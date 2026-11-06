"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PredictionItem {
  id: string;
  title: string;
  volume: string;
  platform: string;
  options: {
    label: string;
    percentage: number;
    change: number;
  }[];
}

const PREDICTION_DATA: PredictionItem[] = [
  {
    id: "pred-1",
    title: "Largest Company end of December 2026?",
    volume: "$9.9M vol.",
    platform: "+5 on Polymarket",
    options: [
      { label: "Apple", percentage: 63.0, change: 3.3 },
      { label: "NVIDIA", percentage: 37.0, change: -2.5 },
      { label: "Microsoft", percentage: 1.0, change: -1.1 },
    ],
  },
  {
    id: "pred-2",
    title: "Anthropic IPO Closing Market Cap",
    volume: "$3.7M vol.",
    platform: "+7 on Polymarket",
    options: [
      { label: "$1.5–$1.75T", percentage: 29.0, change: 3.5 },
      { label: "$1.25–$1.5T", percentage: 19.0, change: 2.9 },
      { label: "$1.75–$2.0T", percentage: 18.0, change: -8.0 },
    ],
  },
  {
    id: "pred-3",
    title: "What will WTI Crude Oil (WTI) hit in November 2026?",
    volume: "$1.4M vol.",
    platform: "+21 on Polymarket",
    options: [
      { label: "↑ $95", percentage: 71.0, change: 12.0 },
      { label: "↓ $85", percentage: 68.0, change: -10.0 },
      { label: "↑ $100", percentage: 44.0, change: 8.0 },
    ],
  },
];

export function PredictionWidget() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Prediction Markets</h2>
      </div>

      <div className="flex flex-col gap-3">
        {PREDICTION_DATA.map((card) => (
          <div
            key={card.id}
            className="p-3.5 rounded-xl bg-[#1B1C20] border border-[#26282E] hover:border-[#33363E] transition-all"
          >
            <div className="text-xs font-semibold text-[#EDEDEE] mb-2 leading-snug">
              {card.title}
            </div>

            {/* Options Rows */}
            <div className="flex flex-col gap-1.5 mb-2.5">
              {card.options.map((opt, i) => {
                const isPositive = opt.change >= 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#989BA3] font-medium text-[11px]">{opt.label}</span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white font-mono tabular-nums text-[11px]">
                        {opt.percentage.toFixed(1)}%
                      </span>

                      <div
                        className={`flex items-center text-[10px] font-medium font-mono tabular-nums ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
                        )}
                        <span>{Math.abs(opt.change).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer metadata */}
            <div className="flex items-center justify-between text-[10px] text-[#717580] pt-2 border-t border-[#23252A]">
              <span>{card.volume}</span>
              <span className="text-[#8E929B] hover:text-white transition-colors cursor-pointer">
                {card.platform}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
