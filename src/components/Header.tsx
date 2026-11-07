"use client";

import React from "react";
import Link from "next/link";
import { BellRing, Sparkles } from "lucide-react";
import { SearchDropdown } from "./SearchDropdown";

interface HeaderProps {
  onOpenSearch?: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

export function Header({ onSelectSymbol }: HeaderProps) {
  return (
    <header className="w-full border-b border-[var(--border)] bg-[var(--bg-page)]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-6 lg:px-8 py-2.5 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Col 1 (Left): Brand Logo */}
        <div className="flex items-center justify-start shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[7px] overflow-hidden flex items-center justify-center shrink-0 border border-white/10 shadow-sm"><img src="/icon.svg" alt="Stockly" className="w-full h-full object-cover" /></div>
            <span className="font-[var(--weight-medium)] text-[14px] text-[var(--text-primary)] tracking-tight whitespace-nowrap">
              Stockly <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">Finance</span>
            </span>
          </Link>
        </div>

        {/* Col 2 (Center): Embedded Active Search Bar with Inline Popover Dropdown */}
        <div className="w-full max-w-[460px] mx-auto">
          <SearchDropdown onSelectSymbol={onSelectSymbol} />
        </div>

        {/* Col 3 (Right): Action Controls */}
        <div className="flex items-center justify-end text-[var(--text-muted)] text-[12px] shrink-0">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors font-[var(--weight-medium)] whitespace-nowrap">
            <BellRing className="w-3.5 h-3.5" />
            <span>Price Alert</span>
          </button>
        </div>
      </div>
    </header>
  );
}

