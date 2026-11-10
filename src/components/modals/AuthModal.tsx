"use client";

import React, { useEffect, useRef } from "react";
import { X, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthModal() {
  const { isAuthModalOpen, authReason, closeAuthModal, loginWithGoogle } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuthModal();
    }
    if (isAuthModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  let title = "Sign in to Stockly Finance";
  let description = "Create custom watchlists, set real-time price alerts, and track assets across all your devices.";

  if (authReason === "watchlist") {
    title = "Sign in to create your watchlist";
    description = "Save your favorite stocks, crypto, and market indices to monitor real-time movements and news.";
  } else if (authReason === "alert") {
    title = "Sign in to set price alerts";
    description = "Receive instant push, email, and in-app notifications whenever your target price is reached.";
  } else if (authReason === "portfolio") {
    title = "Sign in to track your portfolio";
    description = "Log your positions, track live profits and losses, and get personalized financial intelligence.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="relative w-full max-w-[420px] rounded-2xl bg-[#141518] border border-white/10 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-sm overflow-hidden">
          <img src="/icon.svg" alt="Stockly" className="w-8 h-8 object-cover" />
        </div>

        {/* Title & Description */}
        <h2 className="text-[17px] font-semibold text-white tracking-tight">{title}</h2>
        <p className="text-[12.5px] leading-relaxed text-neutral-400 mt-1.5 mb-6 px-2">{description}</p>

        {/* Google OAuth Button */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-[13.5px] transition-all shadow-md active:scale-[0.99]"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        {/* 30-day persistence indicator */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>Session securely saved for 30 days</span>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-neutral-500 mt-5 leading-relaxed">
          By signing in, you agree to Stockly Finance&apos;s Terms of Service and Privacy Policy. All market data is provided for informational purposes.
        </p>
      </div>
    </div>
  );
}
