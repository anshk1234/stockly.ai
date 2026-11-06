"use client";

import React from "react";
import { Search, Monitor, BellRing, Share2, Menu, TrendingUp } from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E2430] bg-[#0A0D14]/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
            Stockly <span className="text-emerald-400 font-medium text-xs px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20">Finance</span>
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-neutral-400 bg-[#121620] hover:bg-[#161B26] border border-[#222838] hover:border-neutral-700 rounded-lg transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
              <span className="text-neutral-400 text-xs sm:text-sm">Search for stocks, crypto, and more...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-500 bg-[#1A202E] border border-neutral-700/50 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-3 text-neutral-300 text-sm">
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#151A24] text-neutral-300 hover:text-white transition-colors text-xs font-medium border border-transparent hover:border-neutral-800">
            <Monitor className="w-4 h-4 text-neutral-400" />
            <span>Computer for Finance</span>
          </button>

          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#151A24] text-neutral-300 hover:text-white transition-colors text-xs font-medium border border-transparent hover:border-neutral-800">
            <BellRing className="w-4 h-4 text-neutral-400" />
            <span>Price Alert</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#151A24] text-neutral-300 hover:text-white transition-colors text-xs font-medium border border-transparent hover:border-neutral-800">
            <Share2 className="w-4 h-4 text-neutral-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button className="p-2 rounded-md hover:bg-[#151A24] text-neutral-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
