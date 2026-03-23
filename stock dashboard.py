import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.express as px
import altair as alt
import time
import json
from streamlit_lottie import st_lottie
from datetime import datetime, timedelta
import io
from streamlit_echarts import st_echarts
import plotly.graph_objects as go
import streamlit.components.v1 as components
from ai_addon import render_ai_tab
import requests 

# Page config
st.set_page_config(page_title="📈 Live Stock Dashboard", layout="wide")

# --- Splash Animation ---
def load_lottiefile(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

if "show_intro" not in st.session_state:
    st.session_state.show_intro = True

if st.session_state.show_intro:
    lottie_intro = load_lottiefile("Money Investment.json")
    splash = st.empty()
    with splash.container():
        st.markdown("<h1 style='text-align:center;'>Welcome to Stock Market Dashboard !</h1>", unsafe_allow_html=True)
        st_lottie(lottie_intro, height=280, speed=1.0, loop=False)
        time.sleep(4)
    splash.empty()
    st.session_state.show_intro = False

#app title
st.header('''📈 Live Stock Dashboard''')



# Fetch live data
@st.cache_data(ttl=3600)   # cache for 1 hour
def fetch_stock_details(ticker, period="1mo"):
    stock = yf.Ticker(ticker)
    info = stock.info

    details = {
        "price": info.get("regularMarketPrice", "N/A"),
        "change_pct": info.get("regularMarketChangePercent", 0),
        "market_cap": info.get("marketCap", "N/A"),
        "pe_ratio": info.get("trailingPE", "N/A"),
        "eps": info.get("trailingEps", "N/A"),
        "high_52w": info.get("fiftyTwoWeekHigh", "N/A"),
        "low_52w": info.get("fiftyTwoWeekLow", "N/A"),
        "volume": info.get("volume", "N/A"),
        "dividend_yield": info.get("dividendYield", "N/A"),
    }

    # Request full OHLC data
    history = stock.history(period=period, interval="1d")[["Open", "High", "Low", "Close"]]
    return details, history



# Define symbols globally for metric tab
symbols = {
    "Apple": "AAPL",
    "Microsoft": "MSFT",
    "Tesla": "TSLA",
    "NVIDIA": "NVDA",
    "Amazon": "AMZN",
    "Google": "GOOG",
    "Meta": "META"
}

@st.cache_data(ttl=36000) # cache for 10 hours
def fetch_metrics():
    metrics = []
    for name, symbol in symbols.items():
        try:
            info = yf.Ticker(symbol).info
            metrics.append({
                "Company": name,
                "PE Ratio": info.get("trailingPE", "N/A"),
                "EPS": info.get("trailingEps", "N/A"),
                "Analyst Rating": info.get("recommendationMean", "N/A")  # 1=Strong Buy, 5=Sell
            })
        except Exception as e:
            st.error(f"Error fetching {name}: {e}")
    return pd.DataFrame(metrics)



# Fetch news
@st.cache_data(ttl=21600) # cache for 6 hours
def fetch_news(ticker):
    try:
        stock = yf.Ticker(ticker)
        return stock.news
    except Exception as e:
        st.error(f"Error fetching news: {e}")
        return []


# Peer comparison dashboard
def show_peer_analysis():
    STOCKS = [
        "AAPL","ABBV","ACN","ADBE","ADP","AMD","AMGN","AMT","AMZN","APD",
        "AVGO","AXP","BA","BK","BKNG","BMY","BRK.B","BSX","C","CAT","CI",
        "CL","CMCSA","COST","CRM","CSCO","CVX","DE","DHR","DIS","DUK",
        "ELV","EOG","EQR","FDX","GD","GE","GILD","GOOG","GOOGL","HD",
        "HON","HUM","IBM","ICE","INTC","ISRG","JNJ","JPM","KO","LIN",
        "LLY","LMT","LOW","MA","MCD","MDLZ","META","MMC","MO","MRK",
        "MSFT","NEE","NFLX","NKE","NOW","NVDA","ORCL","PEP","PFE","PG",
        "PLD","PM","PSA","REGN","RTX","SBUX","SCHW","SLB","SO","SPGI",
        "T","TJX","TMO","TSLA","TXN","UNH","UNP","UPS","V","VZ","WFC",
        "WM","WMT","XOM"
    ]
    horizon_map = {
        "1 Month": "1mo",
        "3 Months": "3mo",
        "6 Months": "6mo",
        "1 Year": "1y",
        "5 Years": "5y",
        "10 Years": "10y",
        "20 Years": "20y",
    }

    DEFAULT_TICKERS = ["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN", "TSLA", "META"]
    tickers = st.multiselect("Select stocks to compare", STOCKS, default=DEFAULT_TICKERS)
    horizon = st.selectbox("Select time horizon", list(horizon_map.keys()), index=2)

    if not tickers:
        st.info("Pick some stocks to compare")
        st.stop()

    @st.cache_data(ttl=21600) # cache for 6 hours
    def load_data(tickers, period):
        frames = []
        for ticker in tickers:
            try:
                df = yf.Ticker(ticker).history(period=period)[["Close"]]
                if not df.empty:
                    df.columns = [ticker]
                    frames.append(df)
            except:
                continue
        if frames:
            return pd.concat(frames, axis=1)
        else:
            return pd.DataFrame()

    data = load_data(tickers, horizon_map[horizon])
    if data.empty or data.isna().all().all():
        st.error("No valid price data to normalize.")
        st.stop()

    clean_data = data.dropna(axis=0, how="any")
    if clean_data.empty or clean_data.shape[0] < 2:
        st.error("Not enough clean data to normalize.")
        st.stop()

    normalized = clean_data.div(clean_data.iloc[0])
    normalized.index.name = "Date"

    # --- Peer comparison chart ---
    st.altair_chart(
        alt.Chart(
            normalized.reset_index().melt(
                id_vars=["Date"], var_name="Stock", value_name="Normalized price"
            )
        )
        .mark_line()
        .encode(
            alt.X("Date:T"),
            alt.Y("Normalized price:Q").scale(zero=False),
            alt.Color("Stock:N"),
        )
        .properties(height=400),
        width="stretch"
    )

    
    # --- Price cards inside expander only ---
    with st.expander("💵 Current Prices of Selected Companies", expanded=True):
        for i in range(0, len(tickers), 4):  # 4 cards per row
            row = st.columns(min(4, len(tickers) - i))
            for j, ticker in enumerate(tickers[i:i+4]):
                try:
                    stock = yf.Ticker(ticker)
                    info = stock.info
                    price = info.get("currentPrice", "N/A")
                    change_pct = info.get("regularMarketChangePercent", 0.0)

                # Sparkline data
                    hist = stock.history(period="1mo")["Close"]
                    sparkline_data = pd.DataFrame({"Date": hist.index, "Price": hist.values})

                # Color based on trend
                    color = "green" if hist.iloc[-1] > hist.iloc[0] else "red"

                    with row[j].container(border=True):
                        st.metric(label=ticker, value=f"${price}", delta=f"{change_pct:.2f}%")

                        # Sparkline with dynamic y-scale and better height
                        sparkline = (
                            alt.Chart(sparkline_data)
                            .mark_line(color=color)
                            .encode(
                                x=alt.X("Date:T", axis=None),
                                y=alt.Y("Price:Q", scale=alt.Scale(domain=[hist.min(), hist.max()]), axis=None)
                            )
                            .properties(height=100)
                        )
                        st.altair_chart(sparkline, width="stretch")

                except:
                    with row[j].container(border=True):
                        st.metric(label=ticker, value="N/A", delta="N/A")

    # --- Peer average comparison charts ---
    if len(tickers) > 1:
        st.markdown("### Individual vs Peer Average")
        cols = st.columns(4)
        for i, ticker in enumerate(tickers):
            peers = normalized.drop(columns=[ticker])
            peer_avg = peers.mean(axis=1)

            plot_data = pd.DataFrame({
                "Date": normalized.index,
                ticker: normalized[ticker],
                "Peer average": peer_avg,
            }).melt(id_vars=["Date"], var_name="Series", value_name="Price")

            chart = alt.Chart(plot_data).mark_line().encode(
                alt.X("Date:T"),
                alt.Y("Price:Q").scale(zero=False),
                alt.Color("Series:N", scale=alt.Scale(domain=[ticker, "Peer average"], range=["red", "gray"])),
                alt.Tooltip(["Date", "Series", "Price"]),
            ).properties(title=f"{ticker} vs peer average", height=300)

            cell = cols[(i * 2) % 4].container(border=True)
            cell.altair_chart(chart, width="stretch")

            delta_data = pd.DataFrame({
                "Date": normalized.index,
                "Delta": normalized[ticker] - peer_avg,
            })

            chart = alt.Chart(delta_data).mark_area().encode(
                alt.X("Date:T"),
                alt.Y("Delta:Q").scale(zero=False),
            ).properties(title=f"{ticker} minus peer average", height=300)

            cell = cols[(i * 2 + 1) % 4].container(border=True)
            cell.altair_chart(chart, width="stretch")

    # raw data display
    st.markdown("## Raw data")
    st.dataframe(data)

def next_saturday(start_date=None):
    if start_date is None:
        start_date = datetime.today()
    days_ahead = 5 - start_date.weekday()  # Saturday = 5
    if days_ahead <= 0:
        days_ahead += 7
    return start_date + timedelta(days=days_ahead)


# Tabs layout
tab1, tab2, tab3, tab4, tab5, tab6, tab_ai= st.tabs(["📈 Live Prices", "📉 Peer Trends", "📊 Metrics",  "📰 News", "⚡ portfolio", "⚙️ Settings & Info", "🤖 AI Insights"])

with tab1:
    st.subheader("🔍 Stock Explorer")

    # --- Stock selector ---
    STOCKS = [
        "AAPL","ABBV","ACN","ADBE","ADP","AMD","AMGN","AMT","AMZN","APD",
        "AVGO","AXP","BA","BK","BKNG","BMY","BRK.B","BSX","C","CAT","CI",
        "CL","CMCSA","COST","CRM","CSCO","CVX","DE","DHR","DIS","DUK",
        "ELV","EOG","EQR","FDX","GD","GE","GILD","GOOG","GOOGL","HD",
        "HON","HUM","IBM","ICE","INTC","ISRG","JNJ","JPM","KO","LIN",
        "LLY","LMT","LOW","MA","MCD","MDLZ","META","MMC","MO","MRK",
        "MSFT","NEE","NFLX","NKE","NOW","NVDA","ORCL","PEP","PFE","PG",
        "PLD","PM","PSA","REGN","RTX","SBUX","SCHW","SLB","SO","SPGI",
        "T","TJX","TMO","TSLA","TXN","UNH","UNP","UPS","V","VZ","WFC",
        "WM","WMT","XOM"
    ]
    selected_ticker = st.selectbox("Choose a company", STOCKS)

    # --- Company name display ---
    stock = yf.Ticker(selected_ticker)
    company_name = stock.info.get("longName", selected_ticker)
    st.markdown(f"## {company_name} ({selected_ticker})")

    # --- Time horizon selector ABOVE chart ---
    horizon_map = {
        "1 Month": "1mo",
        "3 Months": "3mo",
        "6 Months": "6mo",
        "1 Year": "1y",
        "5 Years": "5y",
        "10 Years": "10y",
        "20 Years": "20y",
    }
    
    time_range = st.selectbox(
        "Select time horizon",
        list(horizon_map.keys()),
        index=1  # default to "3 Months"
    )
    # --- Trend chart ---
    details, history = fetch_stock_details(selected_ticker, horizon_map[time_range])
    if not history.empty and {"Open", "High", "Low", "Close"}.issubset(history.columns):
    # Split layout: chart on left, key metrics (Price, PE, EPS) on right
        col_chart, col_metrics = st.columns([4, 1])

        with col_chart:
            fig = go.Figure()

        # Candlestick
            fig.add_trace(go.Candlestick(
                x=history.index,
                open=history["Open"],
                high=history["High"],
                low=history["Low"],
                close=history["Close"],
                name="Candlestick",
                increasing_line_color='green',
                decreasing_line_color='red'
            ))

        # Line chart overlay
            fig.add_trace(go.Scatter(
                x=history.index,
                y=history["Close"],
                mode="lines",
                name="Close Price",
                line=dict(color="cyan", width=2)
            ))

            fig.update_layout(
                xaxis_title="Date",
                yaxis_title="Price",
                xaxis_rangeslider_visible=False,
                template="plotly_dark",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )

            st.plotly_chart(fig, width="stretch")

    # Right-side metrics (card style)
        with col_metrics.container(border=True):
            st.metric("💵 Price", f"${details['price']}", f"{details['change_pct']:.2f}%")
        with col_metrics.container(border=True):
            st.metric("📊 PE Ratio", details['pe_ratio'])
        with col_metrics.container(border=True):
            st.metric("📈 EPS", details['eps'])
    else:
        st.info("Candlestick data not available for this range.")

    # --- Other snapshot cards BELOW chart ---

    row1 = st.columns(3)
    with row1[0].container(border=True):
        st.metric("📦 Volume", f"{details['volume']:,}")
    with row1[1].container(border=True):
        st.metric("🏦 Market Cap", f"${details['market_cap']:,}" if details['market_cap'] != "N/A" else "N/A")
    with row1[2].container(border=True):
        st.metric("🏷️ Sector", stock.info.get("sector", "N/A"))

    row2 = st.columns(3)
    with row2[0].container(border=True):
        st.metric("📉 52W High", f"${details['high_52w']}")
    with row2[1].container(border=True):
        st.metric("📉 52W Low", f"${details['low_52w']}")
    with row2[2].container(border=True):
        st.metric("💸 Dividend Yield", f"{details['dividend_yield']:.2%}" if details['dividend_yield'] != "N/A" else "N/A")
    
    

with tab2:
    show_peer_analysis()


with tab3:
    st.subheader("📊 Financial Metrics & Analyst Insights")
    metrics_df = fetch_metrics()

    # Force Analyst Rating to numeric (convert strings like "3" to 3.0, invalid → NaN)
    metrics_df["Analyst Rating"] = pd.to_numeric(metrics_df["Analyst Rating"], errors="coerce")

    # Line chart: PE Ratio and EPS
    fig_pe_eps = px.line(
        metrics_df.sort_values("EPS"),
        x="Company", y=["PE Ratio", "EPS"],
        title="PE Ratio and EPS by Company", markers=True
    )
    st.plotly_chart(fig_pe_eps, width="stretch")

    # Analyst Rating Chart (bar)
    fig_rating = px.bar(
        metrics_df.sort_values("Analyst Rating", na_position="last"),
        x="Analyst Rating", y="Company",
        orientation="h",
        color="Analyst Rating",
        color_continuous_scale="RdYlGn_r",
        title="Analyst Recommendation Score (1=Strong Buy, 5=Sell)"
    )
    st.plotly_chart(fig_rating, width="stretch")

    # Analyst Rating Gauges in card UI (max 4 per row)
    st.subheader("🔮 Analyst Rating Gauges")
    with st.expander("⚡View Analyst Ratings", expanded=True):
        for i in range(0, len(metrics_df), 4):
            cols = st.columns(4)  # up to 4 cards per row
            for j, (_, row) in enumerate(metrics_df.iloc[i:i+4].iterrows()):
                with cols[j]:
                    with st.container(border=True):  # card-style border
                        st.markdown(f"### {row['Company']}")
                        fig = go.Figure(go.Indicator(
                            mode="gauge+number",
                            value=row["Analyst Rating"],
                            title={"text": "Analyst Rating"},
                            gauge={
                                "axis": {"range": [1, 5]},
                                "steps": [
                                    {"range": [1, 2], "color": "green"},
                                    {"range": [2, 3], "color": "lightgreen"},
                                    {"range": [3, 4], "color": "orange"},
                                    {"range": [4, 5], "color": "red"}
                                ]
                            }
                        ))
                        fig.update_layout(height=250, margin=dict(t=20, b=20, l=10, r=10))
                        # Add a unique key using company name + index
                        st.plotly_chart(fig, width="stretch", key=f"rating_{i}_{j}_{row['Company']}")


    # Full Data Table
    st.dataframe(metrics_df.set_index("Company"))

with tab4:
    st.subheader("📰 General Stock Market News")

    # Collect news from multiple tickers
    tickers = ["MSFT", "TSLA", "NVDA", "AMZN", "GOOG", "META"]
    all_news = []
    for ticker in tickers:
        items = fetch_news(ticker)
        if items:
            all_news.extend(items)

    # Show combined news feed (no ticker headings)
    if all_news:
        for item in all_news[:8]:
            content = item.get("content") or {}
            title = content.get("title", "No title available") or "No title available"
            summary = content.get("summary", "") or ""
            pubDate = content.get("pubDate", None)
            link = (content.get("canonicalUrl") or {}).get("url", None)        # ✅ Fixed
            thumbnail = (content.get("thumbnail") or {}).get("originalUrl", None)  # ✅ Fixed
            provider = (content.get("provider") or {}).get("displayName", "Unknown")  # ✅ Fixed

            # Show headline
            st.markdown(f"### {title}")

            # Show thumbnail if available
            if thumbnail:
                st.image(thumbnail, width=400)

            # Show summary
            if summary:
                st.write(summary)

            # Show source + publish time
            if pubDate:
                st.caption(f"Source: {provider} | Published: {pubDate}")
            else:
                st.caption(f"Source: {provider}")

            # Show link
            if link:
                st.markdown(f"[Read more]({link})")

            st.markdown("---")
    else:
        st.info("No news available at the moment.")


with tab5:
    # Session state to store portfolio
    if "portfolio" not in st.session_state:
        st.session_state.portfolio = []

    st.subheader("📁 Portfolio Tracker")
    st.caption("Track your investments and performance in real-time")

    # upload portfolio from CSV
    uploaded_file = st.file_uploader("📥 Import Portfolio CSV", type=["csv"])
    if uploaded_file:
        imported_df = pd.read_csv(uploaded_file)
        # Convert imported rows into session_state format
        st.session_state.portfolio = [
            {
                "ticker": row["ASSET"],
                "quantity": int(row["DETAIL"].split()[0]),  # e.g., "15 shares @ $120.00"
                "buy_price": float(row["DETAIL"].split("@ $")[1])
            }
            for _, row in imported_df.iterrows()
        ]
        st.success("Portfolio imported successfully!")
        
    #input form to add new asset
    # --- Input Section ---
    st.write("➕ Add New Asset to Portfolio")

    tickers = [
        "AAPL", "ABBV", "ACN", "ADBE", "ADP", "AMD", "AMGN", "AMT", "AMZN", "APD",
        "AVGO", "AXP", "BA", "BK", "BKNG", "BMY", "BRK.B", "BSX", "C", "CAT", "CI",
        "CL", "CMCSA", "COST", "CRM", "CSCO", "CVX", "DE", "DHR", "DIS", "DUK",
        "ELV", "EOG", "EQR", "FDX", "GD", "GE", "GILD", "GOOG", "GOOGL", "HD",
        "HON", "HUM", "IBM", "ICE", "INTC", "ISRG", "JNJ", "JPM", "KO", "LIN",
        "LLY", "LMT", "LOW", "MA", "MCD", "MDLZ", "META", "MMC", "MO", "MRK",
        "MSFT", "NEE", "NFLX", "NKE", "NOW", "NVDA", "ORCL", "PEP", "PFE", "PG",
        "PLD", "PM", "PSA", "REGN", "RTX", "SBUX", "SCHW", "SLB", "SO", "SPGI",
        "T", "TJX", "TMO", "TSLA", "TXN", "UNH", "UNP", "UPS", "V", "VZ", "WFC",
        "WM", "WMT", "XOM"
    ]

    with st.form("add_asset_form"):
        col1, col2, col3 = st.columns([2, 1, 1])

    # 🔽 Replace text_input with selectbox (searchable dropdown)
        ticker_input = col1.selectbox("Search Stock", tickers)

        quantity_input = col2.number_input("Quantity", min_value=1, step=1)
        buy_price_input = col3.number_input("Buy Price", min_value=0.0, format="%.2f")

        submitted = st.form_submit_button("➕ Add Asset")

        if submitted and ticker_input:
            st.session_state.portfolio.append({
                "ticker": ticker_input,   # already uppercase from list
                "quantity": quantity_input,
                "buy_price": buy_price_input
            })

    #  --- Portfolio Table ---
        def get_portfolio_df(portfolio):
            rows = []
            for asset in portfolio:
                ticker = yf.Ticker(asset["ticker"])
                try:
                    current_price = ticker.history(period="1d")["Close"].iloc[-1]
                except:
                    current_price = 0.0
                quantity = asset["quantity"]
                buy_price = asset["buy_price"]
                invested = quantity * buy_price
                value = quantity * current_price
                gain = value - invested
                gain_pct = (gain / invested) * 100 if invested else 0
                rows.append({
                    "ASSET": asset["ticker"],
                    "PRICE": current_price,   # numeric
                    "BALANCE": value,         # numeric
                    "GAIN": gain,             # numeric
                    "GAIN_PCT": gain_pct,     # numeric
                    "DETAIL": f"{quantity} shares @ ${buy_price:.2f}"
                })
            return pd.DataFrame(rows)

        df = get_portfolio_df(st.session_state.portfolio)

    # --- Summary Cards ---
    total_invested = sum(asset["quantity"] * asset["buy_price"] for asset in st.session_state.portfolio)
    total_value = df["BALANCE"].sum() if not df.empty else 0
    total_gain = total_value - total_invested
    gain_pct = (total_gain / total_invested) * 100 if total_invested else 0

    colA, colB, colC = st.columns(3)

    with colA.container(border=True):
        st.metric("💰 Total Balance", f"${total_value:.2f}")

    with colB.container(border=True):
        st.metric("📈 Total Profit/Loss", f"${total_gain:.2f}", f"{gain_pct:.2f}% All Time")

    with colC.container(border=True):
        st.metric("🏦 Invested Capital", f"${total_invested:.2f}")
    
    # --- Charts Section ---
    if not df.empty:
        st.markdown("### 📊 Portfolio Charts")

    # Build data for echarts pie chart
    pie_data = [
        {"value": row["BALANCE"], "name": row["ASSET"]}
        for _, row in df.iterrows()
    ]

    options = {
        "title": {
            "text": "Portfolio Allocation",
            "left": "center",
            "textStyle": {"color": "#fff"},
        },
        "tooltip": {"trigger": "item"},
        "legend": {
            "orient": "vertical",
            "left": "left",
            "textStyle": {"color": "#fff"}  # legend text white
        },
        "series": [
            {
                "name": "Allocation",
                "type": "pie",
                "radius": "90%",
                "data": pie_data,
                "label": {
                    "show": True,
                    "position": "inside",
                    "formatter": "{b}: {d}%",
                    "color": "#fff",           # label text white
                    "fontWeight": "bold",
                    "fontSize": 12
                },
                "emphasis": {
                    "itemStyle": {
                        "shadowBlur": 10,
                        "shadowOffsetX": 0,
                        "shadowColor": "rgba(0, 0, 0, 0.5)"
                    }
                }
            }
        ]
    }

    st_echarts(options=options, height="300px")



    # --- Bar chart for returns ---
    if not df.empty and "GAIN_PCT" in df.columns:
        fig2 = px.bar(
            df,
            x="ASSET",
            y="GAIN",
            color="GAIN",
            text=df["GAIN_PCT"].apply(lambda x: f"{x:.2f}%"),
            title="Gain/Loss by Asset"
        )
        st.plotly_chart(fig2, width="stretch")
    else:
        st.info("No portfolio data available to display returns chart.")


    # --- Holdings Table ---
    st.markdown("### Your Holdings")
    st.dataframe(df.style.format({
        "PRICE": "${:.2f}",
        "BALANCE": "${:.2f}",
        "GAIN": "${:.2f}",
        "GAIN_PCT": "{:.2f}%"
    }), width="stretch")
    
    # Download portfolio as CSV
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="📤 Export Portfolio as CSV",
        data=csv,
        file_name="portfolio.csv",
        mime="text/csv"
    )


with tab6:
    st.subheader("⚙️ Settings & Info")

    # Create two side-by-side columns
    col1, col2 = st.columns(2)

    # --- Maintenance Scheduling Card ---
    with col1:
        with st.container(border=True):
            st.markdown("### 🛠️ Updates & Maintenance Schedule")

            with st.expander("📅 View Calendar", expanded=False):
                components.html("""
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
                <style>
                    .flatpickr-calendar {
                        background: #2c2c2c !important;
                        color: #fff !important;
                        border: 1px solid #444;
                        font-family: 'Segoe UI', sans-serif;
                    }
                    .flatpickr-day:hover {
                        background: #666 !important;
                        color: #fff !important;
                        border-radius: 50% !important;
                    }
                    .flatpickr-day {
                        color: #fff !important;
                    }
                    .flatpickr-day.saturday {
                        background-color: #ff4b4b !important;
                        color: white !important;
                        border-radius: 50% !important;
                    }
                    .flatpickr-weekday {
                        color: #ccc !important;
                    }
                    .flatpickr-months .flatpickr-month {
                        color: #fff !important;
                    }
                    .flatpickr-current-month input.cur-year {
                        color: #ccc !important;
                    }
                </style>
                <input id="calendar" type="text" readonly style="visibility:hidden; height:0;">
                <div id="calendar-container"></div>
                <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
                <script>
                    flatpickr("#calendar", {
                        inline: true,
                        clickOpens: false,
                        defaultDate: "2025-12-20",
                        onDayCreate: function(dObj, dStr, fp, dayElem) {
                            const date = new Date(dayElem.dateObj);
                            if (date.getDay() === 6) {
                                dayElem.classList.add("saturday");
                            }
                        },
                        appendTo: document.getElementById("calendar-container")
                    });
                </script>
                """, height=330)

            # Upcoming Maintenance
            upcoming = next_saturday().date()
            st.markdown(f"🔔 **Upcoming Maintenance:** {upcoming.strftime('%A, %d %B %Y')}")

    # --- Future Updates Card ---
    with col2:
        with st.container(border=True):
            st.markdown("### 🚀 Future Updates")
            st.write("""
            - 🤖 AI Integration for predictive analytics  
            - 📊 chat with your data  
            - 🌐 Multi-source data integration         
            """)
    

    col3, col4 = st.columns(2)

    with col3:
        with st.container(border=True):
            st.markdown("### ⚡ App Status")
            st.markdown("""
            <div style="height:140px; display:flex; justify-content:center; align-items:center;">
                <a href="https://live-stock.betteruptime.com/" target="_blank">
                    <img src="https://uptime.betterstack.com/status-badges/v1/monitor/196o6.svg" 
                         alt="Uptime Badge" 
                         style="transform: scale(3); transform-origin: center;">
                </a>
            </div>
            """, unsafe_allow_html=True)

    with col4:
        with st.container(border=True):
            st.markdown("### 🤝 Collaboration")
            st.markdown("""
            Interested in collaborating or hiring?  
            - 📧 Contact me at: anshkunwar3009@gmail.com  
            - 🧠 Explore more projects: [streamlit](https://share.streamlit.io/user/anshk1234)  
            - 🌐 Visit my GitHub: [github](https://github.com/anshk1234)         
            """)


with tab_ai:
    render_ai_tab(
        selected_ticker, details, history,
        df, total_invested, total_value,
        fetch_stock_details_fn=fetch_stock_details,
        fetch_news_fn=fetch_news
    )

#sidebar
symbols = {
    "Apple": "AAPL",
    "Microsoft": "MSFT",
    "Tesla": "TSLA",
    "NVIDIA": "NVDA",
    "Amazon": "AMZN",
    "Google": "GOOG",
    "Meta": "META"
}


@st.cache_data(ttl=3600)  # cache for 1 hour
def get_daily_details(symbols):
    details = {}
    for name, ticker in symbols.items():
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period="1d")
            if not hist.empty:
                open_price = hist["Open"][0]
                close_price = hist["Close"][0]
                change_pct = ((close_price - open_price) / open_price) * 100
                details[name] = {
                    "price": close_price,
                    "change_pct": change_pct
                }
        except Exception as e:
            st.warning(f"Error fetching {name}: {e}")
    return details

with st.sidebar:
    st.header("📈 Daily Snapshot")

    details = get_daily_details(symbols)

    if details:
        # Find best and worst
        best_stock = max(details, key=lambda x: details[x]["change_pct"])
        worst_stock = min(details, key=lambda x: details[x]["change_pct"])

        # Best stock card
        with st.container(border=True):
            st.markdown("### Today’s Best Stock")
            st.markdown(f"**{best_stock}**")
            st.metric("💵 Price", f"${details[best_stock]['price']:.2f}", f"{details[best_stock]['change_pct']:.2f}%")

        # Worst stock card
        with st.container(border=True):
            st.markdown("### Today’s Worst Stock")
            st.markdown(f"**{worst_stock}**")
            st.metric("💵 Price", f"${details[worst_stock]['price']:.2f}", f"{details[worst_stock]['change_pct']:.2f}%")
    else:
        st.info("No performance data available today.")


st.sidebar.markdown("---")
st.sidebar.markdown("### 🙌 Credits")
st.sidebar.markdown("""
- 👨‍💻 **Developed by**: Ansh Kunwar
- 📊 **Data Source**: [Yahoo Finance](https://finance.yahoo.com)  
- 🖼️ **Logos**: Wikimedia Commons  
- ⚙️ **Tech Stack**: Streamlit + Plotly  
- 🧠 **Source Code**: PRIVATE  
- 🌐 **see other projects**: [streamlit.io/ansh kunwar](https://share.streamlit.io/user/anshk1234)  
- 📧 **Contact**: anshkunwar3009@gmail.com     
-  This App is Licensed Under **Apache License 2.0**
    
""") 

st.sidebar.markdown("<br><center>© 2025 Live Stock Dashboard</center>", unsafe_allow_html=True)
    
# ---- Footer ----
st.markdown("<p style='text-align:center; color:white;'>© 2025 Live Stock Dashboard | Powered by Yahoo Finance</p>", unsafe_allow_html=True)
