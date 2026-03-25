"""
portfolio.py — Portfolio analysis engine.
Parses uploaded CSV, enriches with live data, and computes
all metrics needed by the Portfolio tab in app.py.
No UI logic here.
"""

from __future__ import annotations
import io
import pandas as pd
import numpy as np
import yfinance as yf
from dataclasses import dataclass, field
from backend.cache import cached_ticker_info, cached_history


# ── Expected CSV columns (case-insensitive) ────────────────────────────────
REQUIRED_COLS = {"ticker", "shares", "avg_buy_price"}

SAMPLE_CSV = """ticker,shares,avg_buy_price
AAPL,10,150.00
MSFT,5,280.00
NVDA,8,420.00
TSLA,3,200.00
AMZN,4,130.00
"""


# ── Data structures ────────────────────────────────────────────────────────

@dataclass
class Holding:
    ticker:         str
    shares:         float
    avg_buy_price:  float
    current_price:  float
    name:           str   = ""
    sector:         str   = "Unknown"
    cost_basis:     float = 0.0
    current_value:  float = 0.0
    gain_loss:      float = 0.0
    gain_loss_pct:  float = 0.0
    day_change_pct: float = 0.0
    weight:         float = 0.0      # % of portfolio


@dataclass
class PortfolioSummary:
    total_invested:     float
    current_value:      float
    total_gain_loss:    float
    total_gain_loss_pct: float
    num_holdings:       int
    num_winners:        int
    num_losers:         int
    best_performer:     str
    worst_performer:    str
    best_gain_pct:      float
    worst_gain_pct:     float
    holdings:           list[Holding] = field(default_factory=list)
    sector_weights:     dict[str, float] = field(default_factory=dict)
    history_df:         pd.DataFrame = field(default_factory=pd.DataFrame)


# ── CSV parsing ────────────────────────────────────────────────────────────

def parse_portfolio_csv(file_bytes: bytes) -> tuple[pd.DataFrame, str | None]:
    """
    Parse uploaded CSV bytes.
    Returns (dataframe, error_message).
    error_message is None on success.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        return pd.DataFrame(), f"Could not read CSV: {e}"

    # Normalise column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        return df, (
            f"CSV is missing required columns: **{', '.join(missing)}**. "
            f"Required: ticker, shares, avg_buy_price"
        )

    df["ticker"]        = df["ticker"].astype(str).str.upper().str.strip()
    df["shares"]        = pd.to_numeric(df["shares"],        errors="coerce")
    df["avg_buy_price"] = pd.to_numeric(df["avg_buy_price"], errors="coerce")
    df = df.dropna(subset=["ticker", "shares", "avg_buy_price"])

    if df.empty:
        return df, "No valid rows found after parsing."

    return df, None


# ── Live enrichment ────────────────────────────────────────────────────────

def _enrich_holding(row: pd.Series) -> Holding:
    """Fetch live price + metadata for a single holding row."""
    ticker = row["ticker"]
    shares = float(row["shares"])
    buy_px = float(row["avg_buy_price"])

    info = cached_ticker_info(ticker)
    cur_px = (
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or buy_px                         # fallback to buy price if unavailable
    )
    cur_px = float(cur_px)

    cost   = shares * buy_px
    value  = shares * cur_px
    gl     = value - cost
    gl_pct = (gl / cost * 100) if cost else 0.0

    day_chg = float(info.get("regularMarketChangePercent", 0) or 0)

    return Holding(
        ticker         = ticker,
        shares         = shares,
        avg_buy_price  = buy_px,
        current_price  = cur_px,
        name           = info.get("shortName") or info.get("longName") or ticker,
        sector         = info.get("sector") or "Unknown",
        cost_basis     = round(cost, 2),
        current_value  = round(value, 2),
        gain_loss      = round(gl, 2),
        gain_loss_pct  = round(gl_pct, 2),
        day_change_pct = round(day_chg, 2),
    )


def _portfolio_history(tickers: list[str], shares_map: dict[str, float],
                       buy_map: dict[str, float], period: str = "1y") -> pd.DataFrame:
    """
    Build daily portfolio value time-series.
    Returns DataFrame with columns: Date, Portfolio_Value, Cost_Basis.
    """
    frames = []
    for t in tickers:
        hist = cached_history(t, period)
        if hist.empty:
            continue
        hist = hist[["Close"]].copy()
        hist.index = pd.to_datetime(hist.index).tz_localize(None)
        hist.columns = [t]
        frames.append(hist)

    if not frames:
        return pd.DataFrame()

    combined = pd.concat(frames, axis=1).dropna(how="all").ffill()

    # Weighted by shares
    port_val = pd.Series(0.0, index=combined.index)
    for t in tickers:
        if t in combined.columns:
            port_val += combined[t] * shares_map.get(t, 0)

    cost_total = sum(shares_map.get(t, 0) * buy_map.get(t, 0) for t in tickers)

    result = pd.DataFrame({
        "Date":            port_val.index,
        "Portfolio_Value": port_val.values,
        "Cost_Basis":      cost_total,
    })
    result["Daily_Return"] = result["Portfolio_Value"].pct_change() * 100
    return result.dropna(subset=["Portfolio_Value"])


# ── Main entry point ───────────────────────────────────────────────────────

def analyse_portfolio(df: pd.DataFrame) -> PortfolioSummary:
    """
    Take a validated holdings DataFrame and return a full PortfolioSummary.
    """
    holdings: list[Holding] = []
    for _, row in df.iterrows():
        holdings.append(_enrich_holding(row))

    # Portfolio-level totals
    total_invested = sum(h.cost_basis    for h in holdings)
    current_value  = sum(h.current_value for h in holdings)
    total_gl       = current_value - total_invested
    total_gl_pct   = (total_gl / total_invested * 100) if total_invested else 0.0

    # Weights
    for h in holdings:
        h.weight = round((h.current_value / current_value * 100) if current_value else 0, 2)

    # Best / worst
    sorted_by_gain = sorted(holdings, key=lambda h: h.gain_loss_pct)
    worst = sorted_by_gain[0]
    best  = sorted_by_gain[-1]

    winners = [h for h in holdings if h.gain_loss >= 0]
    losers  = [h for h in holdings if h.gain_loss < 0]

    # Sector weights
    sector_map: dict[str, float] = {}
    for h in holdings:
        sector_map[h.sector] = sector_map.get(h.sector, 0) + h.current_value
    sector_weights = {
        s: round(v / current_value * 100, 2)
        for s, v in sector_map.items()
    }

    # History
    shares_map = {h.ticker: h.shares        for h in holdings}
    buy_map    = {h.ticker: h.avg_buy_price  for h in holdings}
    history_df = _portfolio_history(
        [h.ticker for h in holdings], shares_map, buy_map, period="1y"
    )

    return PortfolioSummary(
        total_invested      = round(total_invested, 2),
        current_value       = round(current_value, 2),
        total_gain_loss     = round(total_gl, 2),
        total_gain_loss_pct = round(total_gl_pct, 2),
        num_holdings        = len(holdings),
        num_winners         = len(winners),
        num_losers          = len(losers),
        best_performer      = best.ticker,
        worst_performer     = worst.ticker,
        best_gain_pct       = best.gain_loss_pct,
        worst_gain_pct      = worst.gain_loss_pct,
        holdings            = holdings,
        sector_weights      = sector_weights,
        history_df          = history_df,
    )


def holdings_to_dataframe(holdings: list[Holding]) -> pd.DataFrame:
    """Convert list[Holding] → display DataFrame."""
    rows = []
    for h in holdings:
        rows.append({
            "Ticker":       h.ticker,
            "Name":         h.name,
            "Sector":       h.sector,
            "Shares":       h.shares,
            "Avg Buy":      h.avg_buy_price,
            "Current":      h.current_price,
            "Cost Basis":   h.cost_basis,
            "Value":        h.current_value,
            "Gain/Loss $":  h.gain_loss,
            "Gain/Loss %":  h.gain_loss_pct,
            "Day Change %": h.day_change_pct,
            "Weight %":     h.weight,
        })
    return pd.DataFrame(rows)