"""
helpers.py — Pure utility functions shared across the app.
No Streamlit, no data fetching, no model calls.
"""

from __future__ import annotations
import datetime
import pandas as pd


# ── Number / text formatting ───────────────────────────────────────────────

def fmt_number(val, prefix: str = "", suffix: str = "", decimals: int = 2) -> str:
    """Safely format a numeric value; returns 'N/A' on failure."""
    try:
        return f"{prefix}{val:,.{decimals}f}{suffix}"
    except (TypeError, ValueError):
        return "N/A"


def fmt_large(val) -> str:
    """Human-readable large numbers: 1 200 000 → '$1.20M'."""
    try:
        v = float(val)
        if v >= 1e12: return f"${v/1e12:.2f}T"
        if v >= 1e9:  return f"${v/1e9:.2f}B"
        if v >= 1e6:  return f"${v/1e6:.2f}M"
        return f"${v:,.0f}"
    except (TypeError, ValueError):
        return "N/A"


def pct_color(val: float) -> str:
    """Return 'green' or 'red' CSS colour string based on sign."""
    return "#26a69a" if val >= 0 else "#ef5350"


def recommendation_badge(rec: str) -> str:
    """Map yfinance recommendationKey to a short display label."""
    mapping = {
        "STRONG_BUY": "🟢 Strong Buy",
        "BUY":        "🟢 Buy",
        "HOLD":       "🟡 Hold",
        "SELL":       "🔴 Sell",
        "STRONG_SELL":"🔴 Strong Sell",
    }
    return mapping.get(rec.upper(), rec)


# ── Date helpers ───────────────────────────────────────────────────────────

def period_to_dates(period: str) -> tuple[datetime.date, datetime.date]:
    """
    Convert a yfinance-style period string to (start_date, end_date).
    Supported: 1mo, 3mo, 6mo, 1y, 2y, 5y.
    """
    today = datetime.date.today()
    mapping = {
        "1mo":  30, "3mo":  90, "6mo": 180,
        "1y":  365, "2y":  730, "5y": 1825,
    }
    days = mapping.get(period, 180)
    return today - datetime.timedelta(days=days), today


def unix_to_str(ts: int, fmt: str = "%d %b %Y") -> str:
    """Convert a Unix timestamp to a formatted date string."""
    try:
        return datetime.datetime.fromtimestamp(ts).strftime(fmt)
    except Exception:
        return ""


# ── DataFrame utilities ────────────────────────────────────────────────────

def returns_summary(df: pd.DataFrame) -> dict:
    """
    Given OHLCV df, return a dict with period return stats.
    """
    if df.empty or "Close" not in df.columns:
        return {}
    close = df["Close"].dropna()
    if len(close) < 2:
        return {}

    daily_ret = close.pct_change().dropna()
    total_ret = (close.iloc[-1] / close.iloc[0] - 1) * 100

    return {
        "total_return_pct": round(total_ret, 2),
        "avg_daily_ret":    round(daily_ret.mean() * 100, 3),
        "volatility":       round(daily_ret.std() * 100, 3),
        "sharpe":           round((daily_ret.mean() / daily_ret.std()) * (252 ** 0.5), 2)
                            if daily_ret.std() > 0 else 0.0,
        "max_drawdown":     round(_max_drawdown(close), 2),
    }


def _max_drawdown(series: pd.Series) -> float:
    peak      = series.cummax()
    drawdown  = (series - peak) / peak * 100
    return float(drawdown.min())


# ── Stock universe ─────────────────────────────────────────────────────────

POPULAR_TICKERS: list[str] = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    "BRK.B", "UNH", "LLY", "JPM", "V", "XOM", "AVGO", "MA",
    "PG", "COST", "HD", "ABBV", "MRK", "NFLX", "CVX", "ORCL",
    "CRM", "AMD", "ADBE", "ACN", "CSCO", "TMO", "LIN",
    # Indian ADRs / popular global
    "INFY", "WIT", "HDB", "RELIANCE.NS", "TCS.NS",
]

PERIOD_OPTIONS: dict[str, str] = {
    "1 Month":  "1mo",
    "3 Months": "3mo",
    "6 Months": "6mo",
    "1 Year":   "1y",
    "2 Years":  "2y",
    "5 Years":  "5y",
}
