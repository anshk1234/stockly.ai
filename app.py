import streamlit as st

st.set_page_config(
    page_title="Stockly.ai — Migrated",
    page_icon="📈",
    layout="centered",
    initial_sidebar_state="collapsed",
)

card_html = """
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}

.stApp {
    background-color: #0c0d0e;
    color: #f3f4f6;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.migration-card {
    background: linear-gradient(180deg, #16181b 0%, #111215 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 36px 32px;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    text-align: center;
    margin: 40px auto;
    max-width: 640px;
}

.badge {
    display: inline-block;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 4px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
}

.card-title {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
}

.card-subtitle {
    font-size: 15px;
    line-height: 1.6;
    color: #9ca3af;
    margin: 0 auto 24px auto;
    max-width: 540px;
}

.cta-button {
    display: inline-block;
    background: #10b981;
    color: #041f16 !important;
    font-weight: 700;
    font-size: 15px;
    padding: 13px 32px;
    border-radius: 10px;
    text-decoration: none !important;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.cta-button:hover {
    background: #059669;
    color: #ffffff !important;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    text-align: left;
    margin: 28px 0;
}

.feature-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: #d1d5db;
}

.feature-item b {
    color: #ffffff;
}

.pr-link-box {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.6;
}

.pr-link-box a {
    color: #60a5fa !important;
    text-decoration: underline !important;
    word-break: break-word;
}
</style>

<div class="migration-card">
<span class="badge">🚀 NEW ARCHITECTURE LIVE</span>
<h1 class="card-title">Stockly.ai Has Moved</h1>
<p class="card-subtitle">
This legacy Streamlit app has been officially migrated to a next-generation Next.js 16 platform hosted on modern, ultra-low latency infrastructure with real-time financial data feeds.
</p>

<div style="margin: 24px 0;">
<a href="https://stocklyai.vercel.app" target="_blank" class="cta-button">Launch New Stockly.ai App →</a>
</div>

<div class="feature-grid">
<div class="feature-item">⚡ <b>Better Infrastructure</b><br/>Zero cold-starts & high-speed edge caching.</div>
<div class="feature-item">📊 <b>TradingView Sparklines</b><br/>Fluid zoomable charts & ambient glows.</div>
<div class="feature-item">🇮🇳 <b>NSE & US Markets</b><br/>Full NIFTY 50, Nifty Bank & 24/7 Crypto.</div>
<div class="feature-item">🔍 <b>Live Ticker Search</b><br/>Instant popover search & price updates.</div>
</div>

<div class="pr-link-box">
Read the full migration details in Pull Request #29:<br/>
<a href="https://github.com/anshk1234/stockly.ai/pull/29" target="_blank">
feat: Perplexity Finance UI overhaul, dynamic Yahoo Finance integration, interactive zoomable charts & CI pipeline
</a>
</div>
</div>
"""

if hasattr(st, "html"):
    st.html(card_html)
else:
    st.markdown(card_html, unsafe_allow_html=True)
