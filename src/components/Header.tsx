"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BellRing, LogOut, User as UserIcon } from "lucide-react";
import { SearchDropdown } from "./SearchDropdown";
import { useApp } from "@/context/AppContext";

interface HeaderProps {
  onOpenSearch?: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

export function Header({ onSelectSymbol }: HeaderProps) {
  const { user, isGuest, openAuthModal, openAlertModal, logout } = useApp();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full border-b border-[var(--border)] bg-[var(--bg-page)]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-6 lg:px-8 py-2.5 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Col 1 (Left): Brand Logo */}
        <div className="flex items-center justify-start shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[7px] overflow-hidden flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
              <img src="/icon.svg" alt="Stockly" className="w-full h-full object-cover" />
            </div>
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
        <div className="flex items-center justify-end gap-2 text-[var(--text-muted)] text-[12px] shrink-0">
          <button
            type="button"
            onClick={() => openAlertModal()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors font-[var(--weight-medium)] whitespace-nowrap"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Price Alert</span>
          </button>

          {/* User Profile or Sign-in */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-white/20 transition-all"
                title={user.name}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-card-hover)] border border-white/10 flex items-center justify-center text-[11px] font-semibold text-[var(--text-primary)]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                    <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-[12px] font-[var(--weight-medium)] transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("general")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-page)] hover:opacity-90 font-[var(--weight-medium)] text-[12px] transition-all whitespace-nowrap shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
