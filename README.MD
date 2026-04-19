# 📈 Stockly.AI

> A sharp, no-fluff AI stock market assistant — built with Streamlit, powered by Ollama cloud models and real-time Yahoo Finance data.

---

## Overview

Stockly.AI is a conversational stock analysis web app. Users can ask natural-language questions about any stock and get concise, data-backed answers alongside a live candlestick chart, key financial metrics, and the latest news headlines — all within a sleek dark-mode interface.

---

## Features

- **AI Chat Interface** — Conversational Q&A powered by Ollama cloud models (streaming responses)
- **Real-Time Stock Data** — Live prices, market cap, P/E, EPS, 52-week high/low, beta, dividend yield, and analyst ratings via `yfinance`
- **Candlestick Charts** — Interactive OHLC chart with volume overlay via Plotly, supporting 1W / 1M / 3M / 6M / 1Y / 5Y timeframes
- **Auto Ticker Detection** — Automatically recognizes stock tickers mentioned in chat (e.g. "What do you think about NVDA?") from a curated list of 100+ popular symbols
- **Latest News** — Fetches and displays the 4 most recent headlines for the active ticker
- **Quick Lookup Sidebar** — Type any ticker, pick a time range, and pull up the chart instantly
- **Popular Stocks Shortcuts** — One-click buttons for AAPL, TSLA, NVDA, MSFT, AMZN, META, GOOGL, JPM
- **Dark Aesthetic UI** — Custom CSS styled after Claude.ai's dark theme using Inter font

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / App | [Streamlit](https://streamlit.io) |
| AI Backend | [Ollama Cloud API](https://ollama.com) (streaming) |
| Stock Data | [yfinance](https://github.com/ranaroussi/yfinance) |
| Charts | [Plotly](https://plotly.com/python/) |
| HTTP | [requests](https://requests.readthedocs.io) |
| Data | [pandas](https://pandas.pydata.org) |

---

## Project Structure

```
.
├── app.py            # Main Streamlit application
├── requirements.txt  # Python dependencies
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- An [Ollama](https://ollama.com) account with an API key

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/stockly-ai.git
cd stockly-ai

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your Ollama API key to Streamlit secrets
mkdir -p .streamlit
echo 'OLLAMA_API_KEY = "your_key_here"' > .streamlit/secrets.toml

# 4. Run the app
streamlit run app.py
```

Then open [http://localhost:8501](http://localhost:8501) in your browser.

---

## Configuration

### Streamlit Secrets

The app reads your Ollama API key from Streamlit's secrets manager. Create `.streamlit/secrets.toml`:

```toml
OLLAMA_API_KEY = "your_ollama_api_key_here"
```

When deploying to [Streamlit Community Cloud](https://streamlit.io/cloud), add this key under **App Settings → Secrets**.

### AI Model

The active model is selected from the sidebar at runtime. To add or change models, edit the `CLOUD_MODELS` dictionary in `app.py`:

```python
CLOUD_MODELS = {
    "GPT-OSS 120B": "gpt-oss:120b",
    # Add more Ollama-compatible model IDs here
}
```

### AI Behavior

Two constants control AI response style:

```python
TEMPERATURE = 0.5   # Creativity level (0 = deterministic, 1 = creative)
MAX_TOKENS  = 1000  # Max response length
```

The system prompt (`SYSTEM_PROMPT`) is tuned for concise, data-first stock analysis. Modify it in `app.py` to adjust the assistant's tone or behavior.

---

## Usage

1. **Chat** — Type any question in the chat bar, e.g.:
   - *"Analyze Apple stock for me"*
   - *"Will NVDA go up this month?"*
   - *"Compare AAPL vs MSFT vs GOOGL"*
   - *"What's the latest news on Tesla?"*

2. **Quick Lookup** — Enter a ticker in the sidebar and click **Show Chart** to pull up metrics and the candlestick chart.

3. **Popular Stocks** — Click any shortcut button in the sidebar (AAPL, TSLA, NVDA, etc.) for instant chart access.

4. **Clear / Reset** — Use the sidebar buttons to clear chat history or reset to the default AAPL view.

---

## Deployment

### Streamlit Community Cloud (recommended)

1. Push the repo to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io) and connect your repo.
3. Set `OLLAMA_API_KEY` under **App Settings → Secrets**.
4. Deploy.

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

---

## Caching

Stock data is cached with a 5-hour TTL (`ttl=18000`) using `@st.cache_data` to avoid redundant API calls to Yahoo Finance. To force a refresh, clear the Streamlit cache via the app menu or restart the server.

---

## Disclaimer

Stockly.AI is for informational and educational purposes only. Nothing in this application constitutes financial advice. Always do your own research before making investment decisions.

---

## License

See [LICENSE](LICENSE) for details.