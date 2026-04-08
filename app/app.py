"""
app.py — Stockly AI  |  Streamlit UI layer.
Run with:  streamlit run app/app.py
All business logic lives in backend/ and models/.
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

from backend.data       import get_stock_details, get_ohlcv, get_news, get_daily_snapshot
from backend.processing import add_moving_averages, add_rsi, add_macd, add_bollinger
from backend.portfolio  import (
    parse_portfolio_csv, analyse_portfolio,
    holdings_to_dataframe, SAMPLE_CSV,
)
from models.predictor   import predict
from utils.helpers      import (
    fmt_number, pct_color, recommendation_badge,
    unix_to_str, returns_summary, POPULAR_TICKERS, PERIOD_OPTIONS,
)

# ════════════════════════════════════════════════════════════════════════════
# PAGE CONFIG
# ════════════════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="Stockly AI",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Global CSS ──────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* ── Base ── */
[data-testid="stAppViewContainer"] { background: #0f1117; }
[data-testid="stSidebar"]          { background: #161b27; border-right: 1px solid #1e2535; }
h1,h2,h3,h4,h5,h6,p,label,div     { color: #e8eaf0 !important; }

/* ── Metric cards ── */
[data-testid="stMetric"] {
    background: #161b27;
    border: 1px solid #1e2535;
    border-radius: 12px;
    padding: 16px 20px;
}
[data-testid="stMetricValue"]  { font-size: 1.4rem !important; font-weight: 700; color: #e8eaf0 !important; }
[data-testid="stMetricLabel"]  { font-size: 0.75rem !important; color: #8892a4 !important; }
[data-testid="stMetricDelta"]  { font-size: 0.85rem !important; }

/* ── Containers / cards ── */
[data-testid="stVerticalBlock"] > [data-testid="stVerticalBlock"] > div:has(.card) {
    border-radius: 12px; background: #161b27; padding: 20px; border: 1px solid #1e2535;
}

/* ── Tabs ── */
[data-baseweb="tab-list"]  { background: #161b27 !important; border-radius: 10px; gap:4px; padding:4px; }
[data-baseweb="tab"]       { background: transparent !important; border-radius: 8px !important;
                             color: #8892a4 !important; padding: 8px 18px !important; font-size:0.85rem; }
[data-baseweb="tab"][aria-selected="true"] {
    background: #1e2a3a !important; color: #e8eaf0 !important;
    border-bottom: 2px solid #3d8ef0 !important;
}

/* ── Buttons ── */
.stButton > button {
    background: #1e2a3a; color: #e8eaf0; border: 1px solid #3d8ef0;
    border-radius: 8px; font-weight: 600;
}
.stButton > button:hover { background: #3d8ef0; color: #fff; }

/* ── Selectbox / input ── */
[data-baseweb="select"] > div { background: #1a2030 !important; border-color: #2a3548 !important; }
input { background: #1a2030 !important; color: #e8eaf0 !important; border-color: #2a3548 !important; }

/* ── Dividers ── */
hr { border-color: #1e2535; }

/* ── Custom card helper ── */
.info-card {
    background: #161b27; border: 1px solid #1e2535; border-radius: 12px;
    padding: 18px 22px; margin-bottom: 12px;
}
.info-card h4 { font-size: 0.75rem; color: #8892a4 !important; margin:0 0 4px; text-transform:uppercase; letter-spacing:.06em; }
.info-card p  { font-size: 1.1rem; font-weight:600; color:#e8eaf0 !important; margin:0; }

/* ── News card ── */
.news-card {
    background: #161b27; border: 1px solid #1e2535; border-radius: 10px;
    padding: 14px 18px; margin-bottom: 10px;
}
.news-card a { color: #3d8ef0 !important; text-decoration: none; font-weight:600; }
.news-card .meta { font-size:0.72rem; color:#8892a4; margin-top:4px; }

/* ── Badge ── */
.badge {
    display:inline-block; padding:3px 10px; border-radius:20px;
    font-size:0.72rem; font-weight:600; letter-spacing:.04em;
}
.badge-green { background:#0d3322; color:#26a69a; }
.badge-red   { background:#2d0f0f; color:#ef5350; }
.badge-grey  { background:#1e2535; color:#8892a4; }
</style>
""", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ════════════════════════════════════════════════════════════════════════════

with st.sidebar:
    st.markdown("""
        <div style='text-align:center; padding: 10px 0 20px;'>
            <span style='font-size:2rem;'>📈</span>
            <h2 style='margin:6px 0 2px; font-size:1.5rem; font-weight:800;'>Stockly AI</h2>
            <p style='font-size:0.75rem; color:#8892a4 !important;'>Smart Stock Intelligence</p>
        </div>
    """, unsafe_allow_html=True)

    # ── Ticker selector ──────────────────────────────────────────────────
    st.markdown("#### 🔍 Select Stock")
    ticker_input = st.selectbox(
        "Ticker",
        options=POPULAR_TICKERS,
        index=0,
        label_visibility="collapsed",
    )
    custom = st.text_input("Or type a custom ticker", placeholder="e.g. RELIANCE.NS")
    ticker = custom.upper().strip() if custom.strip() else ticker_input

    # ── Period ───────────────────────────────────────────────────────────
    st.markdown("#### 📅 Time Period")
    period_label = st.selectbox(
        "Period",
        list(PERIOD_OPTIONS.keys()),
        index=2,
        label_visibility="collapsed",
    )
    period = PERIOD_OPTIONS[period_label]

    # ── Prediction horizon ───────────────────────────────────────────────
    st.markdown("#### 🤖 Prediction Horizon")
    days_ahead = st.slider("Days ahead", min_value=1, max_value=30, value=5)

    st.divider()

    # ── Daily snapshot ───────────────────────────────────────────────────
    st.markdown("#### 📊 Market Snapshot")
    with st.spinner("Loading snapshot…"):
        snapshot = get_daily_snapshot()

    if snapshot:
        best  = max(snapshot, key=lambda k: snapshot[k]["change_pct"])
        worst = min(snapshot, key=lambda k: snapshot[k]["change_pct"])

        with st.container(border=True):
            st.markdown("🏆 **Best Today**")
            d = snapshot[best]
            st.metric(
                label=f"{best}  ({d['ticker']})",
                value=f"${d['price']:.2f}",
                delta=f"{d['change_pct']:+.2f}%",
            )

        with st.container(border=True):
            st.markdown("📉 **Worst Today**")
            d = snapshot[worst]
            st.metric(
                label=f"{worst}  ({d['ticker']})",
                value=f"${d['price']:.2f}",
                delta=f"{d['change_pct']:+.2f}%",
            )
    else:
        st.info("Snapshot unavailable")

    st.divider()
    st.markdown(
        "<p style='font-size:0.7rem;color:#8892a4;text-align:center;'>"
        "Data: Yahoo Finance · Stockly AI © 2025</p>",
        unsafe_allow_html=True,
    )


# ════════════════════════════════════════════════════════════════════════════
# MAIN — load data
# ════════════════════════════════════════════════════════════════════════════

st.markdown(f"## {ticker}")
st.caption(f"Period: **{period_label}**  ·  Prediction horizon: **{days_ahead} day(s)**")

with st.spinner(f"Fetching data for **{ticker}**…"):
    details = get_stock_details(ticker)
    ohlcv   = get_ohlcv(ticker, period)
    news    = get_news(ticker)

if not details or ohlcv.empty:
    st.error(f"Could not load data for **{ticker}**. Check the ticker symbol and try again.")
    st.stop()

# Add indicators for charting
ohlcv_ind = add_moving_averages(ohlcv, [20, 50, 200])
ohlcv_ind = add_rsi(ohlcv_ind)
ohlcv_ind = add_macd(ohlcv_ind)
ohlcv_ind = add_bollinger(ohlcv_ind)

ret_stats = returns_summary(ohlcv)

# ════════════════════════════════════════════════════════════════════════════
# HERO METRICS ROW
# ════════════════════════════════════════════════════════════════════════════

price       = details.get("price", 0)
change_pct  = details.get("change_pct", 0)
color_hex   = pct_color(change_pct)

c1, c2, c3, c4, c5, c6 = st.columns(6)
c1.metric("💵 Price",       f"${price:,.2f}",                    f"{change_pct:+.2f}%")
c2.metric("🏦 Market Cap",  details.get("market_cap", "N/A"))
c3.metric("📊 P/E Ratio",   str(details.get("pe_ratio", "N/A")))
c4.metric("💰 EPS",         str(details.get("eps", "N/A")))
c5.metric("🎯 52W High",    f"${details.get('high_52w', 0):,.2f}" if isinstance(details.get('high_52w'), float) else "N/A")
c6.metric("🔻 52W Low",     f"${details.get('low_52w', 0):,.2f}"  if isinstance(details.get('low_52w'), float) else "N/A")

st.markdown("")

# ════════════════════════════════════════════════════════════════════════════
# TABS
# ════════════════════════════════════════════════════════════════════════════

tab_chart, tab_predict, tab_indicators, tab_info, tab_news, tab_portfolio = st.tabs([
    "📈 Price Chart",
    "🤖 AI Prediction",
    "📉 Indicators",
    "ℹ️ Company Info",
    "📰 News",
    "💼 Portfolio",
])


# ── TAB 1 : Price Chart ─────────────────────────────────────────────────────

with tab_chart:
    chart_type = st.radio(
        "Chart type",
        ["Candlestick", "Line", "Area"],
        horizontal=True,
        label_visibility="collapsed",
    )
    show_sma = st.multiselect(
        "Overlay moving averages",
        ["SMA 20", "SMA 50", "SMA 200"],
        default=["SMA 20", "SMA 50"],
    )

    fig = go.Figure()

    if chart_type == "Candlestick":
        fig.add_trace(go.Candlestick(
            x=ohlcv_ind.index, open=ohlcv_ind["Open"],
            high=ohlcv_ind["High"], low=ohlcv_ind["Low"], close=ohlcv_ind["Close"],
            name=ticker,
            increasing_line_color="#26a69a", decreasing_line_color="#ef5350",
        ))
    elif chart_type == "Line":
        fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["Close"],
            mode="lines", name="Close",
            line=dict(color="#3d8ef0", width=2),
        ))
    else:  # Area
        fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["Close"],
            mode="lines", fill="tozeroy", name="Close",
            line=dict(color="#3d8ef0", width=2),
            fillcolor="rgba(61,142,240,0.12)",
        ))

    # Bollinger bands
    if "BB_Upper" in ohlcv_ind.columns:
        fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["BB_Upper"],
            mode="lines", name="BB Upper",
            line=dict(color="rgba(255,179,0,0.35)", dash="dot", width=1),
        ))
        fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["BB_Lower"],
            mode="lines", name="BB Lower", fill="tonexty",
            line=dict(color="rgba(255,179,0,0.35)", dash="dot", width=1),
            fillcolor="rgba(255,179,0,0.04)",
        ))

    # SMAs
    sma_map = {"SMA 20": ("SMA_20", "#f59e0b"), "SMA 50": ("SMA_50", "#8b5cf6"), "SMA 200": ("SMA_200", "#ef4444")}
    for label in show_sma:
        col, clr = sma_map[label]
        if col in ohlcv_ind.columns:
            fig.add_trace(go.Scatter(
                x=ohlcv_ind.index, y=ohlcv_ind[col],
                mode="lines", name=label,
                line=dict(color=clr, width=1.5, dash="dot"),
            ))

    fig.update_layout(
        template="plotly_dark", paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
        margin=dict(l=0, r=0, t=30, b=0), height=480,
        xaxis_rangeslider_visible=False,
        legend=dict(orientation="h", y=1.06, x=0),
        xaxis=dict(gridcolor="#1e2535"), yaxis=dict(gridcolor="#1e2535"),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Volume bar chart
    vol_colors = ["#26a69a" if c >= o else "#ef5350"
                  for c, o in zip(ohlcv_ind["Close"], ohlcv_ind["Open"])]
    vol_fig = go.Figure(go.Bar(
        x=ohlcv_ind.index, y=ohlcv_ind["Volume"],
        marker_color=vol_colors, name="Volume",
    ))
    vol_fig.update_layout(
        template="plotly_dark", paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
        margin=dict(l=0, r=0, t=10, b=0), height=160,
        xaxis=dict(gridcolor="#1e2535"), yaxis=dict(gridcolor="#1e2535"),
        showlegend=False,
    )
    st.plotly_chart(vol_fig, use_container_width=True)

    # Period return stats
    if ret_stats:
        st.divider()
        st.markdown("##### Period Statistics")
        r1, r2, r3, r4, r5 = st.columns(5)
        r1.metric("Total Return",     f"{ret_stats['total_return_pct']:+.2f}%")
        r2.metric("Avg Daily Return", f"{ret_stats['avg_daily_ret']:+.3f}%")
        r3.metric("Volatility",       f"{ret_stats['volatility']:.3f}%")
        r4.metric("Sharpe Ratio",     str(ret_stats['sharpe']))
        r5.metric("Max Drawdown",     f"{ret_stats['max_drawdown']:.2f}%")


# ── TAB 2 : AI Prediction ───────────────────────────────────────────────────

with tab_predict:
    col_left, col_right = st.columns([2, 1])

    with col_left:
        with st.spinner("Training model…"):
            result = predict(ohlcv, days_ahead=days_ahead)

        if result is None:
            st.warning("Not enough historical data to build a prediction model. Try a longer period (1Y or 2Y).")
        else:
            # ── Prediction chart ───────────────────────────────────────────
            pred_fig = go.Figure()

            # Actual prices
            pred_fig.add_trace(go.Scatter(
                x=result.history_dates,
                y=result.history_actual,
                mode="lines", name="Actual Close",
                line=dict(color="#3d8ef0", width=2),
            ))

            # Model fit
            pred_fig.add_trace(go.Scatter(
                x=result.history_dates,
                y=result.history_predicted,
                mode="lines", name="Model Fit",
                line=dict(color="#f59e0b", width=1.5, dash="dot"),
            ))

            # Future prediction point(s)
            last_date  = result.history_dates[-1]
            future_dates = pd.bdate_range(start=last_date, periods=days_ahead + 1)[1:]

            pred_fig.add_trace(go.Scatter(
                x=list(future_dates),
                y=[result.predicted_price] * len(future_dates),
                mode="lines+markers", name=f"{days_ahead}-Day Forecast",
                line=dict(color="#a78bfa", width=2, dash="dash"),
                marker=dict(size=6),
            ))

            # Confidence band
            pred_fig.add_trace(go.Scatter(
                x=list(future_dates) + list(future_dates[::-1]),
                y=[result.confidence_hi] * len(future_dates) +
                  [result.confidence_lo] * len(future_dates),
                fill="toself", fillcolor="rgba(167,139,250,0.12)",
                line=dict(color="rgba(0,0,0,0)"),
                name="Confidence Band",
            ))

            pred_fig.update_layout(
                template="plotly_dark", paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
                margin=dict(l=0, r=0, t=30, b=0), height=420,
                xaxis=dict(gridcolor="#1e2535"), yaxis=dict(gridcolor="#1e2535"),
                legend=dict(orientation="h", y=1.07, x=0),
                title=dict(text=f"{ticker} — Price Prediction ({days_ahead}d)", font=dict(size=14)),
            )
            st.plotly_chart(pred_fig, use_container_width=True)

    with col_right:
        if result:
            st.markdown("##### Prediction Summary")

            direction = "📈 Bullish" if result.predicted_price > price else "📉 Bearish"
            diff_pct  = ((result.predicted_price - price) / price) * 100

            st.markdown(f"""
            <div class='info-card'>
                <h4>Forecast Price ({days_ahead}d)</h4>
                <p style='font-size:1.6rem;color:{"#26a69a" if diff_pct>=0 else "#ef5350"} !important;'>
                    ${result.predicted_price:,.2f}
                </p>
                <span style='font-size:0.82rem;color:#8892a4;'>{direction} · {diff_pct:+.2f}%</span>
            </div>
            <div class='info-card'>
                <h4>Confidence Range</h4>
                <p>${result.confidence_lo:,.2f} — ${result.confidence_hi:,.2f}</p>
            </div>
            """, unsafe_allow_html=True)

            st.markdown("##### Model Metrics")
            st.metric("MAE",  f"${result.mae}")
            st.metric("RMSE", f"${result.rmse}")
            st.metric("R²",   f"{result.r2:.4f}")

            st.markdown("##### Feature Importance")
            fi = result.feature_importance
            fi_df = pd.DataFrame(
                {"Feature": list(fi.keys()), "Importance": list(fi.values())}
            ).sort_values("Importance", ascending=True)
            fi_fig = px.bar(
                fi_df, x="Importance", y="Feature", orientation="h",
                color="Importance", color_continuous_scale="Blues",
                template="plotly_dark",
            )
            fi_fig.update_layout(
                paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
                margin=dict(l=0, r=0, t=10, b=0), height=280,
                showlegend=False, coloraxis_showscale=False,
                xaxis=dict(gridcolor="#1e2535"),
                yaxis=dict(gridcolor="#1e2535"),
            )
            st.plotly_chart(fi_fig, use_container_width=True)


# ── TAB 3 : Indicators ──────────────────────────────────────────────────────

with tab_indicators:
    ind1, ind2 = st.columns(2)

    with ind1:
        # RSI
        rsi_fig = go.Figure()
        rsi_fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["RSI"],
            mode="lines", name="RSI", line=dict(color="#f59e0b", width=2),
        ))
        rsi_fig.add_hline(y=70, line_color="#ef5350", line_dash="dot", annotation_text="Overbought")
        rsi_fig.add_hline(y=30, line_color="#26a69a", line_dash="dot", annotation_text="Oversold")
        rsi_fig.update_layout(
            template="plotly_dark", paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=30, b=0), height=280,
            title="RSI (14)", xaxis=dict(gridcolor="#1e2535"), yaxis=dict(gridcolor="#1e2535"),
        )
        st.plotly_chart(rsi_fig, use_container_width=True)

        # RSI gauge reading
        rsi_now = ohlcv_ind["RSI"].dropna().iloc[-1] if "RSI" in ohlcv_ind.columns else None
        if rsi_now:
            rsi_label = "Overbought 🔴" if rsi_now > 70 else ("Oversold 🟢" if rsi_now < 30 else "Neutral 🟡")
            st.markdown(f"""
            <div class='info-card' style='text-align:center;'>
                <h4>Current RSI</h4>
                <p style='font-size:2rem;'>{rsi_now:.1f}</p>
                <span style='font-size:0.85rem;color:#8892a4;'>{rsi_label}</span>
            </div>
            """, unsafe_allow_html=True)

    with ind2:
        # MACD
        macd_fig = go.Figure()
        macd_fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["MACD"],
            mode="lines", name="MACD", line=dict(color="#3d8ef0", width=2),
        ))
        macd_fig.add_trace(go.Scatter(
            x=ohlcv_ind.index, y=ohlcv_ind["MACD_Signal"],
            mode="lines", name="Signal", line=dict(color="#f59e0b", width=1.5, dash="dot"),
        ))
        macd_fig.add_trace(go.Bar(
            x=ohlcv_ind.index, y=ohlcv_ind["MACD_Hist"],
            name="Histogram",
            marker_color=ohlcv_ind["MACD_Hist"].apply(lambda v: "#26a69a" if v >= 0 else "#ef5350"),
        ))
        macd_fig.update_layout(
            template="plotly_dark", paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=30, b=0), height=280,
            title="MACD (12, 26, 9)", xaxis=dict(gridcolor="#1e2535"), yaxis=dict(gridcolor="#1e2535"),
            legend=dict(orientation="h", y=1.12),
        )
        st.plotly_chart(macd_fig, use_container_width=True)

        # MACD signal reading
        if "MACD" in ohlcv_ind.columns and "MACD_Signal" in ohlcv_ind.columns:
            m = ohlcv_ind["MACD"].dropna().iloc[-1]
            s = ohlcv_ind["MACD_Signal"].dropna().iloc[-1]
            signal_txt = "Bullish crossover 🟢" if m > s else "Bearish crossover 🔴"
            st.markdown(f"""
            <div class='info-card' style='text-align:center;'>
                <h4>MACD Signal</h4>
                <p style='font-size:1.1rem;'>{signal_txt}</p>
                <span style='font-size:0.8rem;color:#8892a4;'>MACD: {m:.3f} | Signal: {s:.3f}</span>
            </div>
            """, unsafe_allow_html=True)

    # Bollinger bands chart
    bb_fig = go.Figure()
    bb_fig.add_trace(go.Scatter(
        x=ohlcv_ind.index, y=ohlcv_ind["BB_Upper"],
        mode="lines", name="Upper Band", line=dict(color="rgba(255,179,0,0.6)", width=1),
    ))
    bb_fig.add_trace(go.Scatter(
        x=ohlcv_ind.index, y=ohlcv_ind["BB_Lower"],
        mode="lines", name="Lower Band", fill="tonexty",
        line=dict(color="rgba(255,179,0,0.6)", width=1),
        fillcolor="rgba(255,179,0,0.06)",
    ))
    bb_fig.add_trace(go.Scatter(
        x=ohlcv_ind.index, y=ohlcv_ind["Close"],
        mode="lines", name="Close", line=dict(color="#3d8ef0", width=2),
    ))
    bb_fig.add_trace(go.Scatter(
        x=ohlcv_ind.index, y=ohlcv_ind["BB_Mid"],
        mode="lines", name="Mid Band", line=dict(color="#8892a4", width=1, dash="dot"),
    ))
    bb_fig.update_layout(
        template="plotly_dark", paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
        margin=dict(l=0, r=0, t=30, b=0), height=320,
        title="Bollinger Bands (20, 2σ)",
        xaxis=dict(gridcolor="#1e2535"), yaxis=dict(gridcolor="#1e2535"),
        legend=dict(orientation="h", y=1.12),
    )
    st.plotly_chart(bb_fig, use_container_width=True)


# ── TAB 4 : Company Info ────────────────────────────────────────────────────

with tab_info:
    left, right = st.columns([1, 1])

    with left:
        st.markdown(f"### {details.get('name', ticker)}")
        st.caption(f"{details.get('sector', '')}  ·  {details.get('industry', '')}")

        rec = details.get("recommendation", "N/A")
        st.markdown(f"""
        <div style='margin:10px 0;'>
            <span class='badge {"badge-green" if "BUY" in rec else "badge-red" if "SELL" in rec else "badge-grey"}'>
                {recommendation_badge(rec)}
            </span>
        </div>
        """, unsafe_allow_html=True)

        desc = details.get("description", "")
        if desc:
            with st.expander("About the company", expanded=False):
                st.write(desc[:800] + ("…" if len(desc) > 800 else ""))

    with right:
        st.markdown("##### Key Fundamentals")
        rows = [
            ("Exchange",        details.get("exchange", "N/A")),
            ("Currency",        details.get("currency", "N/A")),
            ("Beta",            str(details.get("beta", "N/A"))),
            ("Dividend Yield",  details.get("dividend_yield", "N/A")),
            ("Avg Volume",      f"{details.get('avg_volume', 0):,}" if isinstance(details.get('avg_volume'), (int, float)) else "N/A"),
            ("Target Price",    f"${details.get('target_price', 0):.2f}" if isinstance(details.get("target_price"), float) else "N/A"),
        ]
        for label, val in rows:
            st.markdown(f"""
            <div style='display:flex; justify-content:space-between; padding:8px 0;
                        border-bottom:1px solid #1e2535;'>
                <span style='color:#8892a4; font-size:0.85rem;'>{label}</span>
                <span style='font-weight:600; font-size:0.88rem;'>{val}</span>
            </div>
            """, unsafe_allow_html=True)


# ── TAB 5 : News ────────────────────────────────────────────────────────────

with tab_news:
    if not news:
        st.info("No recent news found for this ticker.")
    else:
        for item in news:
            pub_time = unix_to_str(item["publish_time"])
            st.markdown(f"""
            <div class='news-card'>
                <a href='{item["link"]}' target='_blank'>{item["title"]}</a>
                <div class='meta'>{item["publisher"]}  ·  {pub_time}</div>
            </div>
            """, unsafe_allow_html=True)


# ── TAB 6 : Portfolio ───────────────────────────────────────────────────────

with tab_portfolio:

    # ── Header + upload UI ─────────────────────────────────────────────────
    hdr_l, hdr_r = st.columns([3, 1])
    with hdr_l:
        st.markdown("### 💼 Portfolio Analyser")
        st.caption("Upload a CSV with your holdings to get a full breakdown — P&L, allocation, sector exposure, and historical performance.")
    with hdr_r:
        st.download_button(
            label="⬇️ Download Sample CSV",
            data=SAMPLE_CSV,
            file_name="sample_portfolio.csv",
            mime="text/csv",
            use_container_width=True,
        )

    uploaded = st.file_uploader(
        "Upload your portfolio CSV  (columns: ticker, shares, avg_buy_price)",
        type=["csv"],
        label_visibility="collapsed",
    )

    # ── CSV format hint ────────────────────────────────────────────────────
    if not uploaded:
        st.markdown("""
        <div style='background:#161b27; border:1px dashed #2a3548; border-radius:12px;
                    padding:28px 32px; text-align:center; margin-top:16px;'>
            <div style='font-size:2.2rem;'>📂</div>
            <h4 style='margin:10px 0 6px;'>Drop your portfolio CSV here</h4>
            <p style='color:#8892a4 !important; font-size:0.85rem; margin:0;'>
                Required columns: <code>ticker</code> · <code>shares</code> · <code>avg_buy_price</code>
            </p>
            <p style='color:#8892a4 !important; font-size:0.8rem; margin-top:8px;'>
                Download the sample CSV above to get started instantly.
            </p>
        </div>
        """, unsafe_allow_html=True)
        st.stop()

    # ── Parse ──────────────────────────────────────────────────────────────
    raw_df, err = parse_portfolio_csv(uploaded.read())
    if err:
        st.error(err)
        st.stop()

    with st.spinner("Fetching live prices for all holdings…"):
        summary = analyse_portfolio(raw_df)

    if not summary.holdings:
        st.warning("Could not enrich any holdings. Check your ticker symbols.")
        st.stop()

    holdings_df = holdings_to_dataframe(summary.holdings)

    # ══════════════════════════════════════════════════════════════════════
    # SUMMARY METRIC CARDS
    # ══════════════════════════════════════════════════════════════════════
    st.divider()
    gl_color = "#26a69a" if summary.total_gain_loss >= 0 else "#ef5350"
    gl_sign  = "+" if summary.total_gain_loss >= 0 else ""

    m1, m2, m3, m4, m5, m6 = st.columns(6)
    m1.metric("💰 Invested",        f"${summary.total_invested:,.2f}")
    m2.metric("📊 Current Value",   f"${summary.current_value:,.2f}")
    m3.metric("📈 Total P&L",
              f"{gl_sign}${summary.total_gain_loss:,.2f}",
              f"{gl_sign}{summary.total_gain_loss_pct:.2f}%")
    m4.metric("🏦 Holdings",        str(summary.num_holdings))
    m5.metric("🟢 Winners",         str(summary.num_winners))
    m6.metric("🔴 Losers",          str(summary.num_losers))

    st.markdown("<br>", unsafe_allow_html=True)

    # Best / worst performer cards
    bp_col, wp_col = st.columns(2)
    with bp_col:
        st.markdown(f"""
        <div class='info-card'>
            <h4>🏆 Best Performer</h4>
            <p style='color:#26a69a !important; font-size:1.5rem;'>
                {summary.best_performer}
            </p>
            <span style='font-size:0.85rem; color:#8892a4;'>
                {summary.best_gain_pct:+.2f}% total return
            </span>
        </div>
        """, unsafe_allow_html=True)
    with wp_col:
        st.markdown(f"""
        <div class='info-card'>
            <h4>📉 Worst Performer</h4>
            <p style='color:#ef5350 !important; font-size:1.5rem;'>
                {summary.worst_performer}
            </p>
            <span style='font-size:0.85rem; color:#8892a4;'>
                {summary.worst_gain_pct:+.2f}% total return
            </span>
        </div>
        """, unsafe_allow_html=True)

    st.divider()

    # ══════════════════════════════════════════════════════════════════════
    # ROW 1 — Portfolio value history + Allocation donut
    # ══════════════════════════════════════════════════════════════════════
    row1_l, row1_r = st.columns([2, 1])

    with row1_l:
        st.markdown("##### Portfolio Value — 1 Year")
        if not summary.history_df.empty:
            hist_df = summary.history_df

            hist_fig = go.Figure()

            # Cost basis flat line
            hist_fig.add_trace(go.Scatter(
                x=hist_df["Date"], y=[summary.total_invested] * len(hist_df),
                mode="lines", name="Cost Basis",
                line=dict(color="#8892a4", width=1.5, dash="dot"),
            ))

            # Portfolio value area
            hist_fig.add_trace(go.Scatter(
                x=hist_df["Date"], y=hist_df["Portfolio_Value"],
                mode="lines", name="Portfolio Value",
                fill="tonexty",
                line=dict(color="#3d8ef0", width=2.5),
                fillcolor="rgba(61,142,240,0.10)",
            ))

            hist_fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
                margin=dict(l=0, r=0, t=10, b=0), height=320,
                xaxis=dict(gridcolor="#1e2535"),
                yaxis=dict(gridcolor="#1e2535", tickprefix="$"),
                legend=dict(orientation="h", y=1.08, x=0),
            )
            st.plotly_chart(hist_fig, use_container_width=True)
        else:
            st.info("Not enough history to render the portfolio timeline.")

    with row1_r:
        st.markdown("##### Allocation by Value")
        alloc_fig = go.Figure(go.Pie(
            labels=holdings_df["Ticker"],
            values=holdings_df["Value"],
            hole=0.55,
            textinfo="label+percent",
            textfont_size=11,
            marker=dict(
                colors=px.colors.qualitative.Set3,
                line=dict(color="#0f1117", width=2),
            ),
            hovertemplate="<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>",
        ))
        alloc_fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=10, b=10), height=320,
            showlegend=False,
            annotations=[dict(
                text=f"${summary.current_value:,.0f}",
                x=0.5, y=0.5, font_size=15, font_color="#e8eaf0",
                showarrow=False,
            )],
        )
        st.plotly_chart(alloc_fig, use_container_width=True)

    # ══════════════════════════════════════════════════════════════════════
    # ROW 2 — P&L bar + Sector donut
    # ══════════════════════════════════════════════════════════════════════
    row2_l, row2_r = st.columns([2, 1])

    with row2_l:
        st.markdown("##### Gain / Loss per Holding")
        pnl_df = holdings_df.sort_values("Gain/Loss %")
        bar_colors = ["#26a69a" if v >= 0 else "#ef5350" for v in pnl_df["Gain/Loss %"]]
        pnl_fig = go.Figure(go.Bar(
            x=pnl_df["Ticker"],
            y=pnl_df["Gain/Loss %"],
            marker_color=bar_colors,
            text=pnl_df["Gain/Loss %"].apply(lambda v: f"{v:+.2f}%"),
            textposition="outside",
            hovertemplate="<b>%{x}</b><br>%{y:.2f}%<extra></extra>",
        ))
        pnl_fig.add_hline(y=0, line_color="#8892a4", line_width=1)
        pnl_fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=10, b=0), height=320,
            xaxis=dict(gridcolor="#1e2535"),
            yaxis=dict(gridcolor="#1e2535", ticksuffix="%"),
            showlegend=False,
        )
        st.plotly_chart(pnl_fig, use_container_width=True)

    with row2_r:
        st.markdown("##### Sector Exposure")
        sector_fig = go.Figure(go.Pie(
            labels=list(summary.sector_weights.keys()),
            values=list(summary.sector_weights.values()),
            hole=0.5,
            textinfo="label+percent",
            textfont_size=10,
            marker=dict(
                colors=px.colors.qualitative.Pastel,
                line=dict(color="#0f1117", width=2),
            ),
            hovertemplate="<b>%{label}</b><br>%{value:.1f}%<extra></extra>",
        ))
        sector_fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=10, b=10), height=320,
            showlegend=False,
        )
        st.plotly_chart(sector_fig, use_container_width=True)

    # ══════════════════════════════════════════════════════════════════════
    # ROW 3 — Absolute $ gain waterfall + Daily change bar
    # ══════════════════════════════════════════════════════════════════════
    row3_l, row3_r = st.columns(2)

    with row3_l:
        st.markdown("##### Gain / Loss ($) — Waterfall")
        wf_df = holdings_df.sort_values("Gain/Loss $")
        wf_fig = go.Figure(go.Waterfall(
            name="P&L",
            orientation="v",
            x=wf_df["Ticker"],
            y=wf_df["Gain/Loss $"],
            connector=dict(line=dict(color="#1e2535")),
            increasing=dict(marker=dict(color="#26a69a")),
            decreasing=dict(marker=dict(color="#ef5350")),
            totals=dict(marker=dict(color="#3d8ef0")),
            text=wf_df["Gain/Loss $"].apply(lambda v: f"${v:+,.0f}"),
            textposition="outside",
        ))
        wf_fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=10, b=0), height=300,
            xaxis=dict(gridcolor="#1e2535"),
            yaxis=dict(gridcolor="#1e2535", tickprefix="$"),
            showlegend=False,
        )
        st.plotly_chart(wf_fig, use_container_width=True)

    with row3_r:
        st.markdown("##### Today's Change by Holding")
        day_df     = holdings_df.sort_values("Day Change %")
        day_colors = ["#26a69a" if v >= 0 else "#ef5350" for v in day_df["Day Change %"]]
        day_fig = go.Figure(go.Bar(
            x=day_df["Ticker"],
            y=day_df["Day Change %"],
            marker_color=day_colors,
            text=day_df["Day Change %"].apply(lambda v: f"{v:+.2f}%"),
            textposition="outside",
            hovertemplate="<b>%{x}</b><br>%{y:.2f}%<extra></extra>",
        ))
        day_fig.add_hline(y=0, line_color="#8892a4", line_width=1)
        day_fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#0f1117", plot_bgcolor="#0f1117",
            margin=dict(l=0, r=0, t=10, b=0), height=300,
            xaxis=dict(gridcolor="#1e2535"),
            yaxis=dict(gridcolor="#1e2535", ticksuffix="%"),
            showlegend=False,
        )
        st.plotly_chart(day_fig, use_container_width=True)

    # ══════════════════════════════════════════════════════════════════════
    # HOLDINGS TABLE
    # ══════════════════════════════════════════════════════════════════════
    st.divider()
    st.markdown("##### Holdings Detail")

    def _color_pnl(val):
        if isinstance(val, (int, float)):
            color = "#26a69a" if val >= 0 else "#ef5350"
            return f"color: {color}; font-weight: 600;"
        return ""

    styled = (
        holdings_df.style
        .format({
            "Avg Buy":      "${:,.2f}",
            "Current":      "${:,.2f}",
            "Cost Basis":   "${:,.2f}",
            "Value":        "${:,.2f}",
            "Gain/Loss $":  "${:+,.2f}",
            "Gain/Loss %":  "{:+.2f}%",
            "Day Change %": "{:+.2f}%",
            "Weight %":     "{:.2f}%",
            "Shares":       "{:.4g}",
        })
        .applymap(_color_pnl, subset=["Gain/Loss $", "Gain/Loss %", "Day Change %"])
        .set_properties(**{"background-color": "#161b27", "border-color": "#1e2535"})
        .set_table_styles([
            {"selector": "th", "props": [("background-color", "#1e2535"),
                                          ("color", "#e8eaf0"), ("font-size", "0.8rem")]},
        ])
    )
    st.dataframe(styled, use_container_width=True, height=280)

    # Export button
    csv_export = holdings_df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="📤 Export Enriched Portfolio CSV",
        data=csv_export,
        file_name="portfolio_enriched.csv",
        mime="text/csv",
    )
#end