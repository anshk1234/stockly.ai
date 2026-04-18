import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
import requests
import json
from datetime import datetime, timedelta

# ── Page Config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Stockly.AI",
    page_icon="📈",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ── CSS — Claude.ai dark aesthetic ───────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body,
[data-testid="stAppViewContainer"],
[data-testid="stMain"] {
    background-color: #1e1e1e !important;
    font-family: 'Inter', sans-serif !important;
    color: #ececec !important;
}

#MainMenu, footer { visibility: hidden; }
[data-testid="stDecoration"] { display: none !important; }
[data-testid="stMainBlockContainer"] {
    padding: 28px 36px 120px 36px !important;
    max-width: 820px !important;
    margin: 0 auto !important;
}

/* ── SIDEBAR ── */
[data-testid="stSidebar"] {
    background-color: #171717 !important;
    border-right: 1px solid #2a2a2a !important;
}
[data-testid="stSidebar"] p,
[data-testid="stSidebar"] label {
    color: #9a9a9a !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 13px !important;
}
[data-testid="stSidebar"] [data-baseweb="select"] > div {
    background-color: #1e1e1e !important;
    border: 1px solid #2e2e2e !important;
    border-radius: 8px !important;
    color: #d4d4d4 !important;
    font-size: 13px !important;
}
[data-testid="stSidebar"] .stRadio > div > label {
    background-color: transparent !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 7px !important;
    padding: 8px 12px !important;
    color: #8a8a8a !important;
    font-size: 12.5px !important;
    width: 100% !important;
    cursor: pointer !important;
    transition: background 0.12s !important;
    margin-bottom: 3px !important;
}
[data-testid="stSidebar"] .stRadio > div > label:hover {
    background-color: #232323 !important;
    color: #d4d4d4 !important;
}
[data-testid="stSidebar"] .stRadio > div > label:has(input:checked) {
    background-color: #252525 !important;
    border-color: #4a4a4a !important;
    color: #ececec !important;
    font-weight: 500 !important;
}
[data-testid="stSidebar"] .stButton > button {
    background-color: transparent !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 7px !important;
    color: #8a8a8a !important;
    font-size: 12.5px !important;
    padding: 8px 13px !important;
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 4px !important;
    transition: background 0.12s !important;
}
[data-testid="stSidebar"] .stButton > button:hover {
    background-color: #232323 !important;
    color: #d4d4d4 !important;
}
[data-testid="stSidebar"] hr { border-color: #2a2a2a !important; margin: 12px 0 !important; }

/* ── CHAT ── */
[data-testid="stChatMessage"] {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin-bottom: 4px !important;
}
[data-testid="stChatMessage"] p {
    color: #d4d4d4 !important;
    font-size: 14px !important;
    line-height: 1.75 !important;
}
[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {
    flex-direction: row-reverse !important;
}
[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) > div:last-child {
    background-color: #2a2a2a !important;
    border-radius: 12px 3px 12px 12px !important;
    padding: 11px 15px !important;
    max-width: 80% !important;
    margin-left: auto !important;
}
[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) > div:last-child {
    background-color: transparent !important;
    padding: 6px 0 !important;
}

/* ── CHAT INPUT ── */
[data-testid="stBottom"] {
    background-color: #1e1e1e !important;
    border-top: 1px solid #2a2a2a !important;
    padding: 10px 0 !important;
}
[data-testid="stChatInputTextArea"] {
    background-color: #252525 !important;
    border: 1px solid #2e2e2e !important;
    border-radius: 10px !important;
    color: #d4d4d4 !important;
    font-size: 14px !important;
    caret-color: #d4d4d4 !important;
}
[data-testid="stChatInputTextArea"]:focus {
    border-color: #4a4a4a !important;
    outline: none !important;
    box-shadow: none !important;
}
[data-testid="stChatInputTextArea"]::placeholder { color: #555 !important; }
[data-testid="stChatInputSubmitButton"] > button {
    background-color: #3a3a3a !important;
    border: none !important;
    border-radius: 7px !important;
}
[data-testid="stChatInputSubmitButton"] > button:hover {
    background-color: #4a4a4a !important;
}

/* ── METRICS / CARDS ── */
[data-testid="stMetric"] {
    background-color: #252525 !important;
    border: 1px solid #2e2e2e !important;
    border-radius: 10px !important;
    padding: 14px !important;
}
[data-testid="stMetricLabel"] { color: #888 !important; font-size: 12px !important; }
[data-testid="stMetricValue"] { color: #ececec !important; font-size: 20px !important; font-weight: 600 !important; }
[data-testid="stMetricDelta"] { font-size: 12px !important; }

/* scrollbar */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #171717; }
::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 4px; }

hr { border-color: #2a2a2a !important; }
</style>
""", unsafe_allow_html=True)

# ── Ollama Cloud Models ────────────────────────────────────────────────────────
CLOUD_MODELS = {
    "GPT-OSS 120B":         "gpt-oss:120b",
    
    
}

TEMPERATURE = 0.5
MAX_TOKENS  = 1000

SYSTEM_PROMPT = """You are Stockly.AI — a sharp, no-fluff stock market assistant.

Rules:
- Be ultra-concise. Max 3-5 short sentences or bullet points per response.
- Lead with the key number or verdict immediately.
- No filler phrases like "Great question!" or lengthy disclaimers.
- For predictions, one line: direction + reason + one-word risk level.
- Use $ for prices, % for percentages, K/M/B/T for large numbers.
- Never repeat data the user already knows.
- End every prediction with: ⚠️ Not financial advice.
"""

# ── API Key from secrets ──────────────────────────────────────────────────────
OLLAMA_API_KEY = st.secrets["OLLAMA_API_KEY"]

# ── Session State ─────────────────────────────────────────────────────────────
for k, v in {
    "chat_history": [],
    "current_ticker": "AAPL",
    "show_chart": True,
}.items():
    if k not in st.session_state:
        st.session_state[k] = v

# ── yfinance helpers ──────────────────────────────────────────────────────────
@st.cache_data(ttl=18000)
def get_stock_info(ticker: str):
    try:
        t = yf.Ticker(ticker)
        return t.info
    except Exception:
        return {}

@st.cache_data(ttl=18000)
def get_history(ticker: str, period: str = "3mo"):
    try:
        t = yf.Ticker(ticker)
        return t.history(period=period)
    except Exception:
        return pd.DataFrame()

@st.cache_data(ttl=18000)
def get_news(ticker: str):
    try:
        return yf.Ticker(ticker).news[:6]
    except Exception:
        return []

def format_large(n):
    if not n or n == "N/A":
        return "N/A"
    try:
        n = float(n)
        if n >= 1e12: return f"${n/1e12:.2f}T"
        if n >= 1e9:  return f"${n/1e9:.2f}B"
        if n >= 1e6:  return f"${n/1e6:.2f}M"
        return f"${n:,.0f}"
    except Exception:
        return "N/A"

def safe(val, fmt=None, suffix=""):
    if val is None or val == "N/A":
        return "N/A"
    try:
        if fmt:
            return fmt.format(float(val)) + suffix
        return str(val) + suffix
    except Exception:
        return "N/A"

# ── Ollama streaming API ──────────────────────────────────────────────────────
def stream_ollama(api_key, model, messages):
    try:
        r = requests.post(
            "https://ollama.com/api/chat",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": messages,
                "stream": True,
                "options": {"temperature": TEMPERATURE, "num_predict": MAX_TOKENS},
            },
            timeout=120, stream=True,
        )
        r.raise_for_status()
        for raw in r.iter_lines():
            if raw:
                try:
                    chunk = json.loads(raw)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield token
                    if chunk.get("done"):
                        break
                except Exception:
                    continue
    except requests.exceptions.HTTPError as e:
        code = e.response.status_code
        if code == 401:
            yield "❌ Invalid API key. Go to ollama.com → Settings → API Keys."
        elif code == 404:
            yield f"❌ Model not available on Ollama cloud."
        else:
            yield f"❌ HTTP {code}: {e.response.text[:200]}"
    except requests.exceptions.ConnectionError:
        yield "❌ Cannot reach Ollama API. Check your internet connection."
    except Exception as e:
        yield f"❌ Error: {e}"

# ── Build stock context for AI ────────────────────────────────────────────────
def build_stock_context(ticker: str) -> str:
    info = get_stock_info(ticker)
    if not info:
        return f"Stock data for {ticker} is currently unavailable."
    hist = get_history(ticker, "1mo")
    price_change = ""
    if not hist.empty:
        start = hist["Close"].iloc[0]
        end   = hist["Close"].iloc[-1]
        pct   = (end - start) / start * 100
        price_change = f"1-month return: {pct:+.2f}%"
    return f"""
Current stock data for {info.get('longName', ticker)} ({ticker}):
- Current Price: ${info.get('currentPrice') or info.get('regularMarketPrice', 'N/A')}
- Market Cap: {format_large(info.get('marketCap'))}
- P/E Ratio: {safe(info.get('trailingPE'), '{:.2f}')}
- EPS (TTM): {safe(info.get('trailingEps'), '${:.2f}')}
- 52-Week High: ${safe(info.get('fiftyTwoWeekHigh'), '{:.2f}')}
- 52-Week Low: ${safe(info.get('fiftyTwoWeekLow'), '{:.2f}')}
- Volume: {safe(info.get('volume'), '{:,.0f}')}
- Avg Volume: {safe(info.get('averageVolume'), '{:,.0f}')}
- Revenue (TTM): {format_large(info.get('totalRevenue'))}
- Gross Profit: {format_large(info.get('grossProfits'))}
- Profit Margin: {safe(info.get('profitMargins'), '{:.1%}')}
- Dividend Yield: {safe(info.get('dividendYield'), '{:.2%}')}
- Beta: {safe(info.get('beta'), '{:.2f}')}
- Analyst Rating: {info.get('recommendationKey', 'N/A').title()}
- {price_change}
- Sector: {info.get('sector', 'N/A')}
- Industry: {info.get('industry', 'N/A')}
"""

# ══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown("""
    <div style="padding:20px 0 12px;text-align:center;">
        <span style="font-size:28px;">📈</span>
        <div style="font-family:'Inter',sans-serif;font-size:18px;font-weight:700;
                    color:#ececec;letter-spacing:-0.3px;margin-top:6px;">
            Stockly.AI
        </div>
        <div style="font-size:11px;color:#555;margin-top:2px;">
            AI Stock Market Assistant
        </div>
    </div>
    """, unsafe_allow_html=True)
    st.divider()

    # Model selection
    st.markdown('<p style="font-family:\'Inter\',sans-serif;font-size:11px;font-weight:500;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Model</p>', unsafe_allow_html=True)
    model_label = st.selectbox("m", list(CLOUD_MODELS.keys()), label_visibility="collapsed")
    model_id    = CLOUD_MODELS[model_label]

    st.divider()

    # Quick stock lookup
    st.markdown('<p style="font-family:\'Inter\',sans-serif;font-size:11px;font-weight:500;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Quick Lookup</p>', unsafe_allow_html=True)
    ticker_input = st.text_input("t", value=st.session_state.current_ticker,
                                 placeholder="e.g. AAPL, TSLA, NVDA",
                                 label_visibility="collapsed").upper().strip()

    period_map = {"1 Week": "5d", "1 Month": "1mo", "3 Months": "3mo",
                  "6 Months": "6mo", "1 Year": "1y", "5 Years": "5y"}
    period_label = st.selectbox("p", list(period_map.keys()), index=2, label_visibility="collapsed")
    period       = period_map[period_label]

    if st.button("📊 Show Chart", width='stretch'):
        st.session_state.current_ticker = ticker_input
        st.session_state.show_chart     = True

    st.divider()

    # Popular tickers
    st.markdown('<p style="font-family:\'Inter\',sans-serif;font-size:11px;font-weight:500;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Popular Stocks</p>', unsafe_allow_html=True)
    popular = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOGL", "JPM"]
    for tk in popular:
        if st.button(tk, width='stretch', key=f"pop_{tk}"):
            st.session_state.current_ticker = tk
            st.session_state.show_chart     = True
            st.rerun()

    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        if st.button("🗑 Clear", width='stretch'):
            st.session_state.chat_history = []
            st.session_state.show_chart   = False
            st.rerun()
    with col2:
        if st.button("↩ Reset", width='stretch'):
            st.session_state.chat_history = []
            st.session_state.show_chart   = False
            st.session_state.current_ticker = "AAPL"
            st.rerun()

    st.sidebar.markdown("<br><center style='color:#FFFFF;font-size:16px;'>© 2026 Stockly.ai</center>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# MAIN AREA — Header
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div style="
    margin-top:30px;
    margin-bottom:5px;
    padding-bottom:10px;
    border-bottom:1px solid #2a2a2a;
">
    <div style="
        font-family:'Inter',sans-serif;
        font-size:22px;
        font-weight:700;
        color:#ececec;
        line-height:1.4;
    ">
        📈 Stockly.AI
    </div>
    <div style="
        font-family:'Inter',sans-serif;
        font-size:13px;
        color:#555;
        margin-top:4px;
    ">
        Ask about stocks, get predictions, news & analysis
    </div>
</div>
""", unsafe_allow_html=True)
# ══════════════════════════════════════════════════════════════════════════════
# STOCK CHART & METRICS PANEL
# ══════════════════════════════════════════════════════════════════════════════
if st.session_state.show_chart and st.session_state.current_ticker:
    ticker = st.session_state.current_ticker
    info   = get_stock_info(ticker)
    hist   = get_history(ticker, period)

    if info:
        name  = info.get("longName", ticker)
        price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
        chg   = info.get("regularMarketChange", 0) or 0
        chgp  = info.get("regularMarketChangePercent", 0) or 0
        delta_color = "green" if chg >= 0 else "red"

        # Header
        st.markdown(f"""
        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
            <span style="font-size:20px;font-weight:700;color:#ececec;">{name}</span>
            <span style="font-size:13px;color:#666;">({ticker})</span>
            <span style="font-size:24px;font-weight:700;color:#ececec;">${price:,.2f}</span>
            <span style="font-size:14px;color:{'#4ade80' if chg >= 0 else '#f87171'};">
                {'+' if chg >= 0 else ''}{chg:.2f} ({'+' if chgp >= 0 else ''}{chgp:.2f}%)
            </span>
        </div>
        """, unsafe_allow_html=True)

        # Key metrics
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.metric("Market Cap",  format_large(info.get("marketCap")))
        with c2:
            st.metric("P/E Ratio",   safe(info.get("trailingPE"), "{:.2f}"))
        with c3:
            st.metric("52W High",    f"${safe(info.get('fiftyTwoWeekHigh'), '{:.2f}')}")
        with c4:
            st.metric("52W Low",     f"${safe(info.get('fiftyTwoWeekLow'), '{:.2f}')}")

        c5, c6, c7, c8 = st.columns(4)
        with c5:
            st.metric("EPS (TTM)",   f"${safe(info.get('trailingEps'), '{:.2f}')}")
        with c6:
            st.metric("Div Yield",   safe(info.get("dividendYield"), "{:.2%}"))
        with c7:
            st.metric("Beta",        safe(info.get("beta"), "{:.2f}"))
        with c8:
            rec = info.get("recommendationKey", "N/A").replace("_", " ").title()
            st.metric("Analyst",     rec)

        # Candlestick chart
        if not hist.empty:
            st.markdown("<div style='margin-top:16px;'></div>", unsafe_allow_html=True)
            fig = go.Figure(data=[go.Candlestick(
                x=hist.index,
                open=hist["Open"], high=hist["High"],
                low=hist["Low"],   close=hist["Close"],
                increasing_line_color="#4ade80",
                decreasing_line_color="#f87171",
                name=ticker,
            )])
            # Add volume bars
            colors = ["#4ade80" if c >= o else "#f87171"
                      for c, o in zip(hist["Close"], hist["Open"])]
            fig.add_trace(go.Bar(
                x=hist.index, y=hist["Volume"],
                name="Volume",
                marker_color=colors,
                opacity=0.3,
                yaxis="y2",
            ))
            fig.update_layout(
                plot_bgcolor="#1e1e1e",
                paper_bgcolor="#1e1e1e",
                font=dict(color="#888", family="Inter", size=12),
                xaxis=dict(gridcolor="#2a2a2a", showgrid=True, rangeslider=dict(visible=False)),
                yaxis=dict(gridcolor="#2a2a2a", showgrid=True, side="right"),
                yaxis2=dict(overlaying="y", side="left", showgrid=False, showticklabels=False),
                margin=dict(l=10, r=10, t=30, b=10),
                height=340,
                showlegend=False,
                title=dict(text=f"{ticker} — {period_label}", font=dict(color="#666", size=13)),
            )
            st.plotly_chart(fig, width='stretch')

        # News
        news = get_news(ticker)
        if news:
            st.markdown("<div style='margin-top:8px;font-family:\"Inter\",sans-serif;font-size:11px;font-weight:500;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;'>Latest News</div>", unsafe_allow_html=True)
            for article in news[:4]:
                title     = article.get("content", {}).get("title") or article.get("title", "No title")
                pub_time  = article.get("content", {}).get("pubDate") or ""
                link      = ""
                # Try to get URL from content.clickThroughUrl or canonical url
                content   = article.get("content", {})
                click_url = content.get("clickThroughUrl", {})
                if isinstance(click_url, dict):
                    link = click_url.get("url", "")
                if not link:
                    link = content.get("canonicalUrl", {}).get("url", "#") if isinstance(content.get("canonicalUrl"), dict) else "#"

                st.markdown(f"""
                <div style="padding:10px 14px;background:#252525;border:1px solid #2e2e2e;
                            border-radius:8px;margin-bottom:6px;">
                    <a href="{link}" target="_blank"
                       style="font-family:'Inter',sans-serif;font-size:13px;color:#ececec;
                              text-decoration:none;line-height:1.5;">
                        {title}
                    </a>
                    {f'<div style="font-size:11px;color:#555;margin-top:4px;">{pub_time[:10] if pub_time else ""}</div>' if pub_time else ""}
                </div>
                """, unsafe_allow_html=True)

        st.markdown("<hr style='margin:20px 0;border-color:#2a2a2a;'>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# CHAT INTERFACE
# ══════════════════════════════════════════════════════════════════════════════
if not st.session_state.chat_history and not st.session_state.show_chart:
    st.markdown("""
    <div style="text-align:center; padding:60px 0 40px;">
        <div style="font-size:40px;margin-bottom:12px;">📊</div>
        <div style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;
                    color:#3a3a3a;margin-bottom:8px;">
            What would you like to know?
        </div>
        <div style="font-family:'Inter',sans-serif;font-size:13px;color:#444;line-height:1.7;">
            Ask about stock prices, predictions, company analysis,<br>
            news sentiment, portfolio advice, and more.
        </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;">
        <div style="padding:12px 14px;background:#252525;border:1px solid #2e2e2e;
                    border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:#888;">
            📈 "Analyze Apple stock for me"
        </div>
        <div style="padding:12px 14px;background:#252525;border:1px solid #2e2e2e;
                    border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:#888;">
            🔮 "Will NVDA go up this month?"
        </div>
        <div style="padding:12px 14px;background:#252525;border:1px solid #2e2e2e;
                    border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:#888;">
            📰 "What's the latest news on Tesla?"
        </div>
        <div style="padding:12px 14px;background:#252525;border:1px solid #2e2e2e;
                    border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:#888;">
            💼 "Compare AAPL vs MSFT vs GOOGL"
        </div>
    </div>
    """, unsafe_allow_html=True)

# Display chat history
for msg in st.session_state.chat_history:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Chat input
user_input = st.chat_input("Ask about any stock, prediction, or market news...")

if user_input:
    # Detect stock tickers mentioned
    words      = user_input.upper().split()
    # Common ticker check — single words 1-5 uppercase letters
    candidates = [w.strip(".,!?") for w in words if w.strip(".,!?").isalpha()
                  and 1 <= len(w.strip(".,!?")) <= 5]

    # Try to find relevant ticker
    stock_ctx = ""
    detected_ticker = None

    # Check if ticker in our popular list or try yfinance
    popular_tickers = ["AAPL","ABBV","ACN","ADBE","ADP","AMD","AMGN","AMT","AMZN","APD",
                        "AVGO","AXP","BA","BK","BKNG","BMY","BRK.B","BSX","C","CAT","CI",
                        "CL","CMCSA","COST","CRM","CSCO","CVX","DE","DHR","DIS","DUK",
                        "ELV","EOG","EQR","FDX","GD","GE","GILD","GOOG","GOOGL","HD",
                        "HON","HUM","IBM","ICE","INTC","ISRG","JNJ","JPM","KO","LIN",
                        "LLY","LMT","LOW","MA","MCD","MDLZ","META","MMC","MO","MRK",
                        "MSFT","NEE","NFLX","NKE","NOW","NVDA","ORCL","PEP","PFE","PG",
                        "PLD","PM","PSA","REGN","RTX","SBUX","SCHW","SLB","SO","SPGI",
                        "T","TJX","TMO","TSLA","TXN","UNH","UNP","UPS","V","VZ","WFC",
                        "WM","WMT","XOM"]
    
    for cand in candidates:
        if cand in popular_tickers:
            detected_ticker = cand
            break

    if detected_ticker:
        stock_ctx = build_stock_context(detected_ticker)
        st.session_state.current_ticker = detected_ticker

    # Also build context for currently shown ticker if relevant query
    elif st.session_state.current_ticker and any(
        kw in user_input.lower() for kw in
        ["stock","price","chart","analyze","analysis","predict","forecast",
         "news","buy","sell","hold","invest","recommendation"]
    ):
        stock_ctx = build_stock_context(st.session_state.current_ticker)

    # Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if stock_ctx:
        messages.append({"role": "system", "content": f"Real-time market data:\n{stock_ctx}"})
    for m in st.session_state.chat_history:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_input})

    # Display user message
    st.session_state.chat_history.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    # Stream AI response
    with st.chat_message("assistant"):
        reply_box  = st.empty()
        full_reply = ""
        for token in stream_ollama(OLLAMA_API_KEY, model_id, messages):
            full_reply += token
            reply_box.markdown(full_reply + "▌")
        reply_box.markdown(full_reply)

    st.session_state.chat_history.append({"role": "assistant", "content": full_reply})

    # Auto-show chart for the detected ticker
    if detected_ticker:
        st.session_state.show_chart = True
        st.rerun()
