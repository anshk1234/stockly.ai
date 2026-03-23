# 🤝 Contributing to Stockly.ai

Thanks for taking the time to contribute! Whether it's a bug fix, a new feature, an AI improvement, or a docs update — all help is welcome and appreciated.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [AI Addon Development](#ai-addon-development)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Code Style](#code-style)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/stockly.ai.git
   cd stockly.ai
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## How to Contribute

There are many ways to contribute to Stockly.ai:

- 🐛 Fix a bug in the dashboard or AI addon
- ✨ Add a new feature, chart, or page
- 🤖 Improve AI prompts or add new AI analysis functions
- 🎨 Improve the UI or visualizations
- 📄 Improve the PDF report output
- 📝 Improve documentation
- ⚡ Optimize performance or reduce API calls

---

## Development Setup

### Prerequisites
- Python 3.8+
- An [Ollama](https://ollama.com/) API key (required for AI features)

### Install dependencies

```bash
pip install -r requirements.txt
```

### Configure secrets

Create a `.streamlit/secrets.toml` file in the project root:

```toml
OLLAMA_API_KEY = "your_ollama_api_key_here"
```

### Run the app locally

```bash
streamlit run "stock dashboard.py"
```

The app will be available at `http://localhost:8501`.

---

## AI Addon Development

The AI features live entirely in `ai_addon.py`. Here's how they're structured so you can find your way around:

| Function | What it does |
|---|---|
| `ollama_call(prompt, system)` | Makes a single request to the Ollama API |
| `ai_ticker_prediction(...)` | 7-day price forecast for a given ticker |
| `ai_top5_analysis(...)` | BUY/HOLD/SELL signals for the top 5 tickers |
| `ai_market_sentiment(...)` | Scores overall market mood from news headlines |
| `ai_portfolio_health(...)` | Grades a portfolio A–F with sub-scores |
| `generate_pdf_report(...)` | Builds a downloadable PDF from all AI results |
| `render_ai_tab(...)` | Renders the entire AI Insights tab in Streamlit |

### Tips for working on AI features

- All AI functions receive **already-cached data** — they never make fresh `yfinance` calls themselves. Keep it that way to avoid duplicate API usage.
- All AI functions return **structured JSON**. If you add a new function, follow the same `ollama_call` → `parse_json` pattern.
- When modifying prompts, always test that the model returns **valid JSON** before submitting a PR. Malformed responses will silently fall back to an error state.
- The model is fixed at `gemma3:27b`. Don't change this without discussion, as prompt formatting is tuned to it.
- PDF chart exports use `kaleido` — make sure it's installed if you're adding new charts to the report.

---

## Pull Request Guidelines

Before submitting a pull request, please make sure:

- [ ] Your branch is up to date with `main`
- [ ] The app runs without errors locally
- [ ] AI features work end-to-end (run the full AI tab at least once)
- [ ] Your changes are focused — one feature or fix per PR
- [ ] You've added a clear description of what changed and why
- [ ] Screenshots or recordings are included if you made any UI changes
- [ ] You haven't hardcoded any API keys or secrets

### Submitting your PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub against the `main` branch with a clear title and description of your changes.

---

## Reporting Bugs

Found a bug? Please [open an issue](https://github.com/anshk1234/stockly.ai/issues/new) and include:

- A clear title and description
- Steps to reproduce the bug
- Expected vs. actual behavior
- Whether it's in the core dashboard or the AI tab
- Screenshots or error messages if applicable
- Your Python and Streamlit versions (`streamlit --version`)

---

## Suggesting Features

Have an idea? [Open a feature request](https://github.com/anshk1234/stockly.ai/issues/new) and describe:

- What the feature does
- Which part of the app it belongs to (dashboard, AI tab, PDF report, etc.)
- Why it would be useful
- Any references or examples

---

## Code Style

- Follow standard **PEP 8** Python conventions
- Use clear, descriptive variable and function names
- Keep Streamlit components organized — group related UI elements together
- For AI functions, always include a docstring describing what data the function expects and what JSON shape it returns
- Add comments for any prompt engineering logic — prompts can be subtle and it helps reviewers understand the intent

---

## Questions?

Feel free to open an issue if you're unsure about anything. All contributions, big or small, are genuinely valued. ⭐

> ⚠️ Reminder: Stockly.ai provides informational analysis only. Please don't contribute features that present AI output as financial advice.
