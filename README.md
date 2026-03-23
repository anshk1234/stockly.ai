# 📈 Stockly.ai

A feature-rich **Streamlit** web app for real-time stock market data, interactive visualizations, portfolio tracking, and **AI-powered insights** — all in one place.

🚀 **[Live Demo](https://stockly-ai.streamlit.app/)**

---

## ✨ Features

### Core Dashboard
- **Live Stock Prices** — View real-time prices for any publicly traded company
- **Company Comparison** — Compare multiple stocks side-by-side over custom time ranges
- **Metrics & Analyst Ratings** — Access key financial metrics and professional analyst recommendations
- **Daily Market News** — Stay updated with the latest stock market headlines
- **Personal Portfolio Tracker** — Track your own holdings and monitor performance

### 🤖 AI Insights (New!)
Powered by **Gemma 3 27B** via the Ollama API — a dedicated AI tab that runs on-demand analysis across four areas:

**1. Stock Prediction**
Generates a 7-day price forecast for any selected ticker using the last 30 days of OHLC data. Outputs a BUY / HOLD / SELL signal, confidence level, outlook, support & resistance levels, and a candlestick + AI forecast chart.

**2. Top 5 Tickers Today**
Analyzes AAPL, MSFT, NVDA, TSLA, and META in one click — each gets a signal, one-line summary, and a normalized 30-day performance comparison chart.

**3. Market Sentiment**
Scores today's overall market mood (0–100), classifies it as Bullish / Bearish / Neutral, and provides a Fear / Greed reading based on the latest news headlines from 7 major tickers.

**4. Portfolio Health Grade**
Grades your portfolio from A to F with sub-scores for diversification, performance, and risk management — plus specific risks and actionable suggestions.

**5. PDF Report Export**
Download a full, formatted PDF containing all four AI analyses, charts, and portfolio data with one click.

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| [Streamlit](https://streamlit.io/) | Web app framework |
| [yfinance](https://github.com/ranaroussi/yfinance) | Yahoo Finance data API |
| [Plotly](https://plotly.com/python/) | Interactive charts |
| [Altair](https://altair-viz.github.io/) | Declarative visualizations |
| [Pandas](https://pandas.pydata.org/) | Data manipulation |
| [Ollama API](https://ollama.com/) | AI inference (Gemma 3 27B) |
| [ReportLab](https://www.reportlab.com/) | PDF report generation |
| [Kaleido](https://github.com/plotly/Kaleido) | Plotly chart export for PDF |
| [streamlit-lottie](https://github.com/andfanilo/streamlit-lottie) | Animations |
| [streamlit-echarts](https://github.com/nicedouble/StreamlitAntdComponents) | ECharts integration |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- An [Ollama](https://ollama.com/) API key (for AI features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/anshk1234/stockly.ai.git
cd stockly.ai

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your Ollama API key
# Create .streamlit/secrets.toml and add:
# OLLAMA_API_KEY = "your_key_here"

# 4. Run the app
streamlit run "stock dashboard.py"
```

The app will open in your browser at `http://localhost:8501`.

### AI Setup

The AI features in `ai_addon.py` are already integrated into the main dashboard. Just make sure your `OLLAMA_API_KEY` is set in `.streamlit/secrets.toml`:

```toml
# .streamlit/secrets.toml
OLLAMA_API_KEY = "your_ollama_api_key_here"
```

---

## 📁 Project Structure

```
stockly.ai/
├── stock dashboard.py     # Main Streamlit app
├── ai_addon.py            # AI Insights tab (Gemma 3 27B)
├── Money Investment.json  # Lottie animation asset
├── requirements.txt       # Python dependencies
├── .streamlit/            # Streamlit config & secrets
├── contributing.md        # Contribution guide
└── LICENSE                # Apache 2.0
```

---

## 📦 Dependencies

```
streamlit==1.52.1
yfinance==0.2.66
pandas==2.3.3
plotly==6.5.0
altair==6.0.0
streamlit-lottie==0.0.5
streamlit-echarts==0.4.0
reportlab
kaleido
requests>=2.31.0
```

---

## 🤝 Contributing

Contributions are welcome! Please read [contributing.md](contributing.md) for guidelines on how to get started.

---

## 📄 License

This project is licensed under the **Apache 2.0 License** — see the [LICENSE](LICENSE) file for details.

---

## ⭐ Show Your Support

If you find this project useful, please give it a star — it really helps!

[![GitHub stars](https://img.shields.io/github/stars/anshk1234/stockly.ai?style=social)](https://github.com/anshk1234/stockly.ai/stargazers)

> ⚠️ All AI analysis is for informational purposes only and does not constitute financial advice.
