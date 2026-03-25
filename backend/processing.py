"""
processing.py — Data cleaning and feature engineering.
All transformations on raw OHLCV DataFrames live here.
No I/O, no UI, no caching.
"""

from __future__ import annotations
import pandas as pd
import numpy as np


# ── Moving averages ────────────────────────────────────────────────────────

def add_moving_averages(df: pd.DataFrame, windows: list[int] = [20, 50, 200]) -> pd.DataFrame:
    """Add SMA columns (SMA_<n>) to *df*. Returns a copy."""
    out = df.copy()
    for w in windows:
        if len(out) >= w:
            out[f"SMA_{w}"] = out["Close"].rolling(w).mean()
    return out


# ── RSI ────────────────────────────────────────────────────────────────────

def add_rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Add RSI_14 column. Returns a copy."""
    out = df.copy()
    delta = out["Close"].diff()
    gain  = delta.clip(lower=0)
    loss  = (-delta).clip(lower=0)
    avg_g = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_l = loss.ewm(com=period - 1, min_periods=period).mean()
    rs    = avg_g / avg_l.replace(0, np.nan)
    out["RSI"] = 100 - (100 / (1 + rs))
    return out


# ── MACD ───────────────────────────────────────────────────────────────────

def add_macd(df: pd.DataFrame) -> pd.DataFrame:
    """Add MACD, MACD_Signal, MACD_Hist columns. Returns a copy."""
    out   = df.copy()
    ema12 = out["Close"].ewm(span=12, adjust=False).mean()
    ema26 = out["Close"].ewm(span=26, adjust=False).mean()
    out["MACD"]        = ema12 - ema26
    out["MACD_Signal"] = out["MACD"].ewm(span=9, adjust=False).mean()
    out["MACD_Hist"]   = out["MACD"] - out["MACD_Signal"]
    return out


# ── Bollinger Bands ────────────────────────────────────────────────────────

def add_bollinger(df: pd.DataFrame, window: int = 20, std: float = 2.0) -> pd.DataFrame:
    """Add BB_Mid, BB_Upper, BB_Lower columns. Returns a copy."""
    out     = df.copy()
    mid     = out["Close"].rolling(window).mean()
    sigma   = out["Close"].rolling(window).std()
    out["BB_Mid"]   = mid
    out["BB_Upper"] = mid + std * sigma
    out["BB_Lower"] = mid - std * sigma
    return out


# ── ML feature matrix ──────────────────────────────────────────────────────

def build_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build the feature DataFrame used for ML training and prediction.
    Features:
        Lag_1 … Lag_5   — previous N closing prices
        SMA_10, SMA_20  — short moving averages
        RSI             — momentum oscillator
        Volume_Norm     — volume normalised by 20-day rolling mean
    Target:
        Target          — next-day closing price (shifted by -1)
    Drops NaN rows introduced by rolling / shifting.
    """
    out = df.copy()

    # Lag features
    for lag in range(1, 6):
        out[f"Lag_{lag}"] = out["Close"].shift(lag)

    # Rolling averages
    out["SMA_10"] = out["Close"].rolling(10).mean()
    out["SMA_20"] = out["Close"].rolling(20).mean()

    # RSI
    delta = out["Close"].diff()
    gain  = delta.clip(lower=0)
    loss  = (-delta).clip(lower=0)
    avg_g = gain.ewm(com=13, min_periods=14).mean()
    avg_l = loss.ewm(com=13, min_periods=14).mean()
    rs    = avg_g / avg_l.replace(0, np.nan)
    out["RSI"] = 100 - (100 / (1 + rs))

    # Volume
    vol_mean = out["Volume"].rolling(20).mean().replace(0, np.nan)
    out["Volume_Norm"] = out["Volume"] / vol_mean

    # Target
    out["Target"] = out["Close"].shift(-1)

    return out.dropna()


FEATURE_COLS = ["Lag_1", "Lag_2", "Lag_3", "Lag_4", "Lag_5",
                "SMA_10", "SMA_20", "RSI", "Volume_Norm"]
