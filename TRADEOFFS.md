# Tradeoffs — Mumzworld AI Gift Finder

## Why This Problem

**Gift finding is a high-leverage, real Mumzworld use case.** Moms shopping for gifts for other moms/babies face decision fatigue — hundreds of products, unclear age-appropriateness, and no easy way to express "thoughtful gift for a friend's baby shower under 200 AED."

**Why I picked it over alternatives:**

| Considered | Why rejected |
|-----------|--------------|
| Voice memo → shopping list | Requires speech-to-text pipeline, harder to eval in 5 hours |
| Return reason classifier | Less customer-facing impact, simpler AI problem |
| Product deduplication | Internal tool, harder to demo, needs real catalog data |
| Symptom triage assistant | Medical liability concerns, harder to scope safely |

**Gift finder wins because:**
- Directly drives revenue (gift → purchase)
- Natural language is the right interface (hard to express gift intent via filters)
- Bilingual is essential (gift-givers may be EN speakers buying for AR-speaking families)
- Clear evaluation criteria (did the recommendation match intent, age, budget?)

## Architecture Decisions

### Pre-filtering before LLM
I extract keywords, price, and age from the query **before** sending to the LLM. This means the LLM reasons over ~15 relevant candidates, not 40+ products. This improves relevance and reduces hallucination.

### Groq + Llama 3.3 70B
- **Free tier** — no API costs
- **Fast inference** — Groq's LPU gives sub-second responses
- **Strong multilingual** — Llama 3.3 handles Arabic well (not perfectly, but well enough)
- **JSON mode** — native structured output support reduces parsing errors

### Zod Schema Validation
Every LLM response is validated against a strict Zod schema. If the model returns malformed JSON, missing fields, or empty-string filler, the system catches it and returns an explicit error rather than silently passing garbage to the frontend.

### Mock Dataset (not scraped)
Per the assignment constraint, I generated 40 realistic products with native Arabic names and descriptions, covering 10 categories with prices in AED.

## What I Cut

- **Embeddings/RAG**: Would improve semantic search but keyword matching + LLM reasoning is sufficient for 40 products
- **User sessions/history**: Would enable "remember my preferences" but out of scope for 5 hours
- **Image generation**: Product images would improve the UI but are cosmetic

## What I'd Build Next

1. **Embeddings-based search** — Use a small embedding model to do semantic similarity instead of keyword matching
2. **Feedback loop** — Let users rate recommendations, use that data to improve prompts
3. **Conversational flow** — Multi-turn: "Show me something similar but cheaper"
4. **Real catalog integration** — Connect to Mumzworld's actual product API
5. **A/B testing framework** — Compare different prompts/models on real user queries

## Uncertainty Handling

The system handles uncertainty at three levels:

1. **Query level**: Out-of-scope queries (medical, non-baby) get a polite refusal with `query_understood: false`
2. **Product level**: Each recommendation has a confidence score (0-1). Low confidence = vague match.
3. **Budget level**: If no products fit the budget, the system says so explicitly instead of recommending anyway.
