"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AssetQuote } from "@/lib/types";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AppContextType {
  user: UserProfile | null;
  isGuest: boolean;
  isLoadingUser: boolean;
  // Auth Modal
  isAuthModalOpen: boolean;
  authReason: "watchlist" | "alert" | "portfolio" | "general";
  openAuthModal: (reason?: "watchlist" | "alert" | "portfolio" | "general") => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  // Price Alert Modal
  isAlertModalOpen: boolean;
  alertInitialAsset?: AssetQuote | { symbol: string; name: string; price: number; currency?: string } | null;
  openAlertModal: (asset?: AssetQuote | { symbol: string; name: string; price: number; currency?: string } | null) => void;
  closeAlertModal: () => void;
  // Manage Watchlist Modal & State
  savedSymbols: string[];
  isWatchlistSaved: (symbol: string) => boolean;
  toggleWatchlist: (symbol: string, name?: string, assetType?: string) => Promise<boolean>;
  isManageWatchlistOpen: boolean;
  openManageWatchlist: () => void;
  closeManageWatchlist: () => void;
  refreshWatchlist: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<"watchlist" | "alert" | "portfolio" | "general">("general");

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertInitialAsset, setAlertInitialAsset] = useState<
    AssetQuote | { symbol: string; name: string; price: number; currency?: string } | null
  >(null);

  // Check 30-day session on mount
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user || null);
          }
        }
      } catch (err) {
        console.error("Failed to check auth session:", err);
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = (reason: "watchlist" | "alert" | "portfolio" | "general" = "general") => {
    setAuthReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openAlertModal = (
    asset?: AssetQuote | { symbol: string; name: string; price: number; currency?: string } | null
  ) => {
    setAlertInitialAsset(asset || null);
    setIsAlertModalOpen(true);
  };

  const closeAlertModal = () => {
    setIsAlertModalOpen(false);
    setAlertInitialAsset(null);
  };

  const loginWithGoogle = () => {
    if (typeof window !== "undefined") {
      const returnTo = window.location.pathname + window.location.search;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    }
  };

  const [savedSymbols, setSavedSymbols] = useState<string[]>([]);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);

  const refreshWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        if (data.savedSymbols && Array.isArray(data.savedSymbols)) {
          setSavedSymbols(data.savedSymbols);
        }
      }
    } catch (err) {
      console.error("Failed to refresh watchlist:", err);
    }
  };

  // Sync watchlist when user logs in
  useEffect(() => {
    if (user) {
      refreshWatchlist();
    } else {
      setSavedSymbols([]);
    }
  }, [user]);

  const isWatchlistSaved = (symbol: string) => {
    return savedSymbols.includes(symbol.toUpperCase());
  };

  const toggleWatchlist = async (symbol: string, name?: string, assetType?: string): Promise<boolean> => {
    if (!user) {
      openAuthModal("watchlist");
      return false;
    }

    const upperSymbol = symbol.toUpperCase();
    const currentlySaved = savedSymbols.includes(upperSymbol);

    // Optimistic UI update
    if (currentlySaved) {
      setSavedSymbols((prev) => prev.filter((s) => s !== upperSymbol));
    } else {
      setSavedSymbols((prev) => [...prev, upperSymbol]);
    }

    try {
      if (currentlySaved) {
        await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: upperSymbol }),
        });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: upperSymbol,
            name: name || upperSymbol,
            assetType: assetType || "STOCK",
          }),
        });
      }
      return !currentlySaved;
    } catch (err) {
      console.error("Failed to toggle watchlist in D1:", err);
      // Rollback on error
      if (currentlySaved) {
        setSavedSymbols((prev) => [...prev, upperSymbol]);
      } else {
        setSavedSymbols((prev) => prev.filter((s) => s !== upperSymbol));
      }
      return currentlySaved;
    }
  };

  const openManageWatchlist = () => {
    if (!user) {
      openAuthModal("watchlist");
      return;
    }
    setIsManageWatchlistOpen(true);
  };

  const closeManageWatchlist = () => {
    setIsManageWatchlistOpen(false);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      setSavedSymbols([]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isGuest: !user,
        isLoadingUser,
        isAuthModalOpen,
        authReason,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        logout,
        isAlertModalOpen,
        alertInitialAsset,
        openAlertModal,
        closeAlertModal,
        savedSymbols,
        isWatchlistSaved,
        toggleWatchlist,
        isManageWatchlistOpen,
        openManageWatchlist,
        closeManageWatchlist,
        refreshWatchlist,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
