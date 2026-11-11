# Contributing to Stockly.ai

Thank you for your interest in contributing to **Stockly.ai**! Whether you are fixing bugs, optimizing chart rendering performance, improving market intelligence data pipelines, or enhancing the documentation, your contributions are warmly welcomed.

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [Stockly Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [anshkunwar3009@gmail.com](mailto:anshkunwar3009@gmail.com).

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (v10+)
- **Git**

### Local Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/stockly.ai.git
   cd stockly.ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   *(For full local authentication and watchlist sync testing, populate your Google OAuth Client ID/Secret and Cloudflare D1 credentials if available; guest mode works out of the box).*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🌿 Branching & Git Workflow

1. Always create a new feature branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. Follow **Conventional Commits**:
   - `feat:` A new feature (e.g., `feat(chart): add cursor pointer dot on curve`)
   - `fix:` A bug fix (e.g., `fix(alerts): resolve z-index modal conflict`)
   - `docs:` Documentation improvements (e.g., `docs: update README setup guide`)
   - `perf:` Performance optimizations (e.g., `perf(cache): implement 24h watchlist cache`)
   - `ci:` Continuous integration fixes or workflow updates

---

## 🧪 Quality Standards & Verification

Before submitting a Pull Request, make sure your code passes all CI checks locally:

```bash
# 1. Run ESLint code quality rules
npm run lint

# 2. Run TypeScript strict type verification
npx tsc --noEmit

# 3. Test production build
npm run build
```

---

## 📬 Submitting a Pull Request (PR)

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of `anshk1234/stockly.ai`.
3. Fill out the provided PR template describing what changed and why.
4. Ensure all automated GitHub Actions CI checks (Lint, TypeScript, Production Build) pass.

---

## 💡 Reporting Bugs & Proposing Features

- **Found a bug?** Check existing [Issues](https://github.com/anshk1234/stockly.ai/issues) to avoid duplicates, then open a bug report using our issue template.
- **Have an idea?** Submit a feature request describing the use case and proposed solution.
