"use client";

import React, { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import { AuthModal } from "@/components/modals/AuthModal";
import { PriceAlertModal } from "@/components/modals/PriceAlertModal";
import { ManageWatchlistModal } from "@/components/modals/ManageWatchlistModal";
import { NotificationDrawer } from "@/components/modals/NotificationDrawer";
import { AlertToast } from "@/components/modals/AlertToast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <AuthModal />
      <PriceAlertModal />
      <ManageWatchlistModal />
      <NotificationDrawer />
      <AlertToast />
    </AppProvider>
  );
}
