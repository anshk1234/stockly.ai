"use client";

import React, { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import { AuthModal } from "@/components/modals/AuthModal";
import { PriceAlertModal } from "@/components/modals/PriceAlertModal";
import { ManageWatchlistModal } from "@/components/modals/ManageWatchlistModal";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <AuthModal />
      <PriceAlertModal />
      <ManageWatchlistModal />
    </AppProvider>
  );
}
