"""
cache.py — Caching layer for stock data fetching.
Uses Streamlit's built-in cache_data with configurable TTLs.
All raw API calls are routed through this module.
"""

import streamlit as st
import yfinance as yf
import pandas as pd


# ── TTL constants (seconds) ────────────────────────────────────────────────
TTL_PRICE   = 3_600      # 1 h  — live price / details
TTL_HISTORY = 21_600     # 6 h  — OHLCV history
TTL_NEWS    = 21_600     # 6 h  — news feed
TTL_PEERS   = 21_600     # 6 h  — peer / comparison data


@st.cache_data(ttl=TTL_PRICE, show_spinner=False)
def cached_ticker_info(ticker: str) -> dict:
    """Return raw yfinance .info dict for *ticker*."""
    try:
        return yf.Ticker(ticker).info
    except Exception:
        return {}


@st.cache_data(ttl=TTL_HISTORY, show_spinner=False)
def cached_history(ticker: str, period: str, interval: str = "1d") -> pd.DataFrame:
    """Return OHLCV history for *ticker* with given *period* and *interval*."""
    try:
        df = yf.Ticker(ticker).history(period=period, interval=interval)
        if df.empty:
            return pd.DataFrame()
        return df[["Open", "High", "Low", "Close", "Volume"]]
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=TTL_NEWS, show_spinner=False)
def cached_news(ticker: str) -> list:
    """Return latest news items for *ticker*."""
    try:
        return yf.Ticker(ticker).news or []
    except Exception:
        return []


@st.cache_data(ttl=TTL_PEERS, show_spinner=False)
def cached_multi_history(tickers: tuple, period: str) -> pd.DataFrame:
    """
    Return normalised close prices for multiple tickers.
    *tickers* must be a tuple (hashable) for cache key stability.
    """
    frames = []
    for t in tickers:
        try:
            df = yf.Ticker(t).history(period=period)[["Close"]]
            if not df.empty:
                df.columns = [t]
                frames.append(df)
        except Exception:
            continue
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, axis=1)
