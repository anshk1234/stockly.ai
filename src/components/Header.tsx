"use client";

import React from "react";
import Link from "next/link";
import { Search, Monitor, BellRing, Share2, Menu, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#23252A] bg-[#141517]/95 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-6 h-6 rounded flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm sm:text-base tracking-tight text-[#EDEDEE] flex items-center gap-1.5">
            Stockly <span className="text-[#8E929B] font-normal text-xs">Finance</span>
          </span>
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#8E929B] bg-[#1B1C20] hover:bg-[#202227] border border-[#282A2F] hover:border-[#353840] rounded-lg transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-[#6D717B] group-hover:text-[#A1A4AC] transition-colors" />
              <span className="text-[#8E929B] text-xs">Search for stocks, crypto, and more...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#6D717B] bg-[#22242A] border border-[#2B2D34] rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 text-[#A1A4AC] text-xs">
          <button className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#1E1F24] hover:text-[#EDEDEE] transition-colors font-medium">
            <Monitor className="w-3.5 h-3.5 text-[#7F838D]" />
            <span>Computer for Finance</span>
          </button>

          <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#1E1F24] hover:text-[#EDEDEE] transition-colors font-medium">
            <BellRing className="w-3.5 h-3.5 text-[#7F838D]" />
            <span>Price Alert</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#1E1F24] hover:text-[#EDEDEE] transition-colors font-medium">
            <Share2 className="w-3.5 h-3.5 text-[#7F838D]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[#1E1F24] text-[#7F838D] hover:text-[#EDEDEE] transition-colors">
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
