"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";

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
    volume: "$9.8M vol.",
    platform: "+5 on Polymarket",
    options: [
      { label: "Apple", percentage: 67.0, change: 7.8 },
      { label: "NVIDIA", percentage: 32.0, change: 7.5 },
      { label: "Microsoft", percentage: 1.0, change: -1.0 },
    ],
  },
  {
    id: "pred-2",
    title: "What will WTI Crude Oil (WTI) hit in November 2026?",
    volume: "$1.4M vol.",
    platform: "+21 on Polymarket",
    options: [
      { label: "↓ $85", percentage: 71.0, change: -9.0 },
      { label: "↑ $95", percentage: 67.0, change: 11.0 },
      { label: "↓ $80", percentage: 43.0, change: -12.0 },
    ],
  },
  {
    id: "pred-3",
    title: "Anthropic IPO Closing Market Cap",
    volume: "$3.2M vol.",
    platform: "+14 on Polymarket",
    options: [
      { label: "$1.5–$1.75T", percentage: 28.0, change: 4.3 },
      { label: "$1.25–$1.5T", percentage: 21.0, change: 4.7 },
    ],
  },
];

export function PredictionWidget() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold text-neutral-200">Prediction Markets</h2>
      </div>

      <div className="flex flex-col gap-3.5">
        {PREDICTION_DATA.map((card) => (
          <div
            key={card.id}
            className="p-3.5 rounded-xl bg-[#11151F] border border-[#1C2230] hover:border-neutral-700/60 transition-all"
          >
            <div className="text-xs font-semibold text-neutral-200 mb-2.5 leading-snug">
              {card.title}
            </div>

            {/* Options Rows */}
            <div className="flex flex-col gap-2 mb-3">
              {card.options.map((opt, i) => {
                const isPositive = opt.change >= 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">{opt.label}</span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white font-mono">
                        {opt.percentage.toFixed(1)}%
                      </span>

                      <div
                        className={`flex items-center text-[10px] font-semibold font-mono ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                        )}
                        <span>{Math.abs(opt.change).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer metadata */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-[#181D28]">
              <span>{card.volume}</span>
              <span className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                {card.platform}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
