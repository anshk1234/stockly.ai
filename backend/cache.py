"""
cache.py — Caching layer for stock data fetching.
Uses yf.download() as the primary method (reliable on Streamlit Cloud).
Falls back to Ticker().history() if needed.
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
    """
    Return raw yfinance .info dict for *ticker*.
    On Streamlit Cloud, .info can be rate-limited — we fall back
    to fast_info which is much more reliable.
    """
    try:
        t = yf.Ticker(ticker)
        info = t.info
        # yfinance sometimes returns a stub dict with only a few keys on cloud
        if info and len(info) > 5:
            return info
        # Fallback: build minimal info from fast_info (more reliable on cloud)
        fi = t.fast_info
        minimal = {
            "currentPrice":               getattr(fi, "last_price",          None),
            "regularMarketPrice":         getattr(fi, "last_price",          None),
            "regularMarketChangePercent": getattr(fi, "regular_market_change_percent", None) or 0,
            "marketCap":                  getattr(fi, "market_cap",          None),
            "fiftyTwoWeekHigh":           getattr(fi, "fifty_two_week_high", None),
            "fiftyTwoWeekLow":            getattr(fi, "fifty_two_week_low",  None),
            "volume":                     getattr(fi, "last_volume",         None),
            "currency":                   getattr(fi, "currency",            "USD"),
            "exchange":                   getattr(fi, "exchange",            "N/A"),
        }
        return {k: v for k, v in minimal.items() if v is not None}
    except Exception:
        return {}


@st.cache_data(ttl=TTL_HISTORY, show_spinner=False)
def cached_history(ticker: str, period: str, interval: str = "1d") -> pd.DataFrame:
    """
    Return OHLCV history using yf.download() — the most reliable method
    on Streamlit Cloud. Falls back to Ticker().history() if download fails.
    """
    # ── Primary: yf.download (works on cloud, avoids cookie/rate issues) ──
    try:
        df = yf.download(
            ticker,
            period=period,
            interval=interval,
            auto_adjust=True,
            progress=False,
            threads=False,
        )
        if not df.empty:
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            for col in ["Open", "High", "Low", "Close", "Volume"]:
                if col not in df.columns:
                    return pd.DataFrame()
            df = df[["Open", "High", "Low", "Close", "Volume"]]
            df.index = pd.to_datetime(df.index).tz_localize(None)
            return df.sort_index()
    except Exception:
        pass

    # ── Fallback: Ticker().history() ─────────────────────────────────────
    try:
        df = yf.Ticker(ticker).history(period=period, interval=interval)
        if not df.empty:
            df = df[["Open", "High", "Low", "Close", "Volume"]]
            df.index = pd.to_datetime(df.index).tz_localize(None)
            return df.sort_index()
    except Exception:
        pass

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
    Return close prices for multiple tickers via yf.download batch call.
    *tickers* must be a tuple (hashable) for cache key stability.
    """
    try:
        df = yf.download(
            list(tickers),
            period=period,
            auto_adjust=True,
            progress=False,
            threads=False,
        )
        if df.empty:
            return pd.DataFrame()
        # Extract Close prices from MultiIndex columns
        if isinstance(df.columns, pd.MultiIndex):
            close = df.xs("Close", axis=1, level=0) if "Close" in df.columns.get_level_values(0) else pd.DataFrame()
        else:
            close = df[["Close"]] if "Close" in df.columns else pd.DataFrame()

        if close.empty:
            return pd.DataFrame()
        close.index = pd.to_datetime(close.index).tz_localize(None)
        return close.sort_index()
    except Exception:
        pass

    # Fallback: one by one
    frames = []
    for t in tickers:
        try:
            h = cached_history(t, period)
            if not h.empty:
                frames.append(h[["Close"]].rename(columns={"Close": t}))
        except Exception:
            continue
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, axis=1)
