# 🎁 Mumzworld AI Gift Finder

**Track A: AI Engineering Intern**

An AI-powered gift recommendation engine for Mumzworld — the largest mother & baby e-commerce platform in the Middle East. Users describe who they're shopping for in natural language (English or Arabic), and the system returns a curated shortlist of gifts with bilingual reasoning, confidence scores, and honest uncertainty handling.

## Architecture

```
Frontend (React + Vite)     →  Bilingual UI with EN/AR toggle, RTL support
        ↓
Backend API (Node.js/Express)  →  Input validation, keyword extraction, Zod schema validation
        ↓
LLM Layer (Groq + Llama 3.3 70B)  →  Reasoning, confidence scoring, bilingual output
        ↓
Product Dataset (40 mock products)  →  Pre-filtered via keyword/category/price/age matching
```

## Quick Setup (< 5 minutes)

### Prerequisites
- Node.js 18+
- Free Groq API key from [console.groq.com](https://console.groq.com)

### 1. Clone & Install

```bash
git clone <repo-url>
cd mumzworld-gift-finder

# Install backend
cd backend
npm install
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Install frontend
cd ../frontend
npm install
```

### 2. Add your API key

Edit `backend/.env`:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173
Live - https://mumzworld-assignment-1.onrender.com/

## Features

- **Natural language queries** in English and Arabic
- **Bilingual responses** — native Arabic, not translated
- **Confidence scores** for each recommendation (0-100%)
- **Schema validation** via Zod — malformed LLM output is caught, not silently passed
- **Uncertainty handling** — refuses out-of-scope queries (medical advice, non-baby products)
- **Budget awareness** — notes when no products match the price range
- **Pre-filtering** — keyword extraction narrows products before LLM call for relevance

## Evals

See [EVALS.md](./EVALS.md) for the full evaluation suite with 14 test cases.

Run evals:
```bash
cd backend
npm run eval
```

## Tradeoffs

See [TRADEOFFS.md](./TRADEOFFS.md) for problem selection rationale, architecture decisions, and known limitations.

## Tooling

- **LLM**: Groq (free tier) with Llama 3.3 70B Versatile — chosen for fast inference, free API, and strong multilingual capabilities
- **Coding assistant**: Antigravity (Claude Opus) for pair-coding the full stack
- **Schema validation**: Zod for structured output validation
- **Frontend**: React + Vite for fast dev experience
- **Backend**: Node.js + Express — lightweight, familiar, fast to ship

## Time Log

| Phase | Time |
|-------|------|
| Problem selection & planning | 30 min |
| Mock dataset creation | 30 min |
| Backend API + LLM integration | 1.5 hrs |
| Frontend UI | 1.5 hrs |
| Evals & testing | 45 min |
| Documentation | 15 min |
| **Total** | **~5 hrs** |
