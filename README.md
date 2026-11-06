# Stockly.ai 📈

[![CI Pipeline](https://github.com/anshk1234/stockly.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/anshk1234/stockly.ai/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://stocklyai.vercel.app/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A lightweight, highly optimized financial intelligence platform to track global stocks, cryptocurrencies, and prediction markets in real-time. Engineered to handle large-scale live market data with minimal resource consumption.

🔗 **Live Demo**: [https://stocklyai.vercel.app/](https://stocklyai.vercel.app/)

---

## ✨ Features

- **Live Market Intelligence**: Real-time quotes, multi-period performance metrics, and financial news dynamically streamed via Yahoo Finance.
- **Interactive Pro Charting**:
  - Pointer-anchored mouse wheel zoom in and out.
  - Smooth click-and-drag panning across historical periods.
  - Hairline price and time grid lines with baseline indicators.
  - Glassmorphic, translucent hover card that never obscures data points.
- **Dynamic Brand Logos**: Automated high-resolution favicon fetching via company website domains with fallback monogram badges.
- **Instant Search Popover**: Zero background blur, keyboard accessible (`⌘K`), with recent searches and live trending tickers.
- **Multi-Market Support**: Seamless toggle between Indian Markets (NIFTY 50, BSE Sensex) and US Markets (NASDAQ, S&P 500).
- **Sub-35ms In-Memory Cache**: High-performance TTL caching minimizing API latency and shielding rate limits.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Engine**: `yahoo-finance2` API with in-memory TTL caching
- **CI/CD**: GitHub Actions & Vercel Edge Network

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ installed
- npm / yarn / pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anshk1234/stockly.ai.git
   cd stockly.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & CI

Validate code quality and build compilation:

```bash
# Run ESLint
npm run lint

# Run TypeScript type check
npx tsc --noEmit

# Run production build
npm run build
```

---

## 📄 License

Licensed under the [Apache-2.0 License](LICENSE).
