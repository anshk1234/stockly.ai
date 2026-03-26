# 📈 Stockly.ai

> A feature-rich **Streamlit** web app for real-time stock market data, interactive visualizations, AI-powered predictive analysis, and smart summarisation — all in one place.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-stockly--ai.streamlit.app-brightgreen?style=for-the-badge)](https://stockly-ai.streamlit.app/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.52.1-FF4B4B?style=for-the-badge&logo=streamlit)](https://streamlit.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/anshk1234/stockly.ai?style=for-the-badge)](https://github.com/anshk1234/stockly.ai/stargazers)
[![CI](https://img.shields.io/github/actions/workflow/status/anshk1234/stockly.ai/main.yml?label=CI&style=for-the-badge)](https://github.com/anshk1234/stockly.ai/actions)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Stock Prices** | View real-time prices for any publicly traded company |
| 🔀 **Company Comparison** | Compare multiple stocks side-by-side over custom time ranges |
| 📉 **Metrics & Analyst Ratings** | Access key financial metrics and professional analyst recommendations |
| 📰 **Daily Market News** | Stay updated with the latest stock market headlines |
| 💼 **Personal Portfolio Tracker** | Track your own holdings and monitor performance |
| 🤖 **AI Predictive Analysis** | AI-powered stock trend prediction and forecasting |
| 📝 **AI Summarisation** | Automatic summarisation of stock performance and news |
| 📄 **PDF Export** | Export your data and charts as PDF reports |

---

## 🖥️ Screenshots

> _Add screenshots here to showcase the app's UI_

### Live Stock Prices
### Company Comparison
### AI Predictive Analysis
### Personal Portfolio Tracker

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| [Streamlit](https://streamlit.io/) | Web app framework |
| [yfinance](https://github.com/ranaroussi/yfinance) | Yahoo Finance data API |
| [Plotly](https://plotly.com/python/) | Interactive charts |
| [Altair](https://altair-viz.github.io/) | Declarative visualizations |
| [Pandas](https://pandas.pydata.org/) | Data manipulation |
| [ReportLab](https://www.reportlab.com/) | PDF export |
| [streamlit-lottie](https://github.com/andfanilo/streamlit-lottie) | Animations |
| [streamlit-echarts](https://github.com/nicedouble/StreamlitAntdComponents) | ECharts integration |

---

## 🚀 Getting Started

### Prerequisites

- Python **3.8** or higher
- `pip` package manager

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/anshk1234/stockly.ai.git
cd stockly.ai

# 2. (Recommended) Create a virtual environment
python -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
streamlit run app/main.py
```

The app will open in your browser at `http://localhost:8501`.

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

> See [`requirements.txt`](requirements.txt) for the full list.

---

## 📁 Project Structure

```
stockly.ai/
├── .github/
│   └── workflows/            # GitHub Actions CI/CD pipelines
├── .streamlit/               # Streamlit configuration (theme, secrets)
├── app/                      # Frontend — Streamlit pages and UI components
├── backend/                  # Backend logic — data fetching and processing
├── models/                   # AI/ML models for predictive analysis
├── utils/                    # Shared utility functions and helpers
├── requirements.txt          # Python dependencies
├── LICENSE                   # Apache 2.0 License
└── README.md                 # Project documentation
```

---

## 🤖 AI Features

Stockly.ai integrates AI capabilities directly into the dashboard:

- **Predictive Analysis** — Machine learning models trained on historical stock data to forecast price trends.
- **Smart Summarisation** — Automatic summarisation of news and stock performance to give you quick, actionable insights.

The AI logic lives in the `models/` directory and is wired into the app via `backend/`.

---

## ⚙️ CI/CD

This project uses **GitHub Actions** for continuous integration. Workflows are defined in `.github/workflows/` and automatically run on every push and pull request to `main`.

---

## 🤝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting a pull request.

---

## 📄 License

This project is licensed under the **Apache 2.0 License** — see the [LICENSE](LICENSE) file for details.

---

## ⭐ Show Your Support

If you find Stockly.ai useful, please give it a ⭐ on GitHub — it really helps!

---

> Built with ❤️ by [anshk1234](https://github.com/anshk1234)
