import { Router } from "express";
import { searchProducts } from "../services/search.js";
import { getGiftRecommendations } from "../services/llm.js";
import { validateResponse } from "../schemas/gift.js";

const router = Router();

/**
 * Extract search hints from the user query to pre-filter products.
 * This is a lightweight keyword extractor — the LLM does the real reasoning.
 */
function extractSearchHints(query) {
  const q = query.toLowerCase();
  const hints = { keywords: [], category: undefined, maxPrice: undefined, minPrice: undefined, ageMonths: undefined };

  // Price extraction
  const priceMatch = q.match(/(?:under|below|less than|أقل من|تحت)\s*(\d+)/);
  if (priceMatch) hints.maxPrice = parseInt(priceMatch[1]);
  const minPriceMatch = q.match(/(?:above|over|more than|أكثر من|فوق)\s*(\d+)/);
  if (minPriceMatch) hints.minPrice = parseInt(minPriceMatch[1]);
  const budgetMatch = q.match(/(?:budget|ميزانية)\s*(\d+)/);
  if (budgetMatch) hints.maxPrice = parseInt(budgetMatch[1]);

  // Age extraction
  const ageMonthMatch = q.match(/(\d+)\s*(?:month|شهر)/);
  if (ageMonthMatch) hints.ageMonths = parseInt(ageMonthMatch[1]);
  const ageYearMatch = q.match(/(\d+)\s*(?:year|سنة|سنوات)/);
  if (ageYearMatch) hints.ageMonths = parseInt(ageYearMatch[1]) * 12;
  // "newborn" shortcut
  if (q.includes("newborn") || q.includes("مولود") || q.includes("حديث الولادة")) {
    hints.ageMonths = 1;
  }

  // Category keywords
  const categoryMap = {
    stroller: "strollers", عربة: "strollers",
    carrier: "carriers", حامل: "carriers",
    feeding: "feeding", رضاعة: "feeding", تغذية: "feeding",
    toy: "toys", لعبة: "toys", ألعاب: "toys",
    skincare: "skincare", عناية: "skincare",
    bedding: "bedding", سرير: "bedding",
    safety: "safety", أمان: "safety", monitor: "safety",
    clothing: "clothing", ملابس: "clothing",
    "car seat": "car_seats", "مقعد سيارة": "car_seats",
    gift: "gifts", هدية: "gifts",
    mom: "mom_care", أم: "mom_care", ماما: "mom_care",
  };
  for (const [kw, cat] of Object.entries(categoryMap)) {
    if (q.includes(kw)) {
      hints.category = cat;
      break;
    }
  }

  // General keywords for relevance scoring
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  hints.keywords = words;

  return hints;
}

/**
 * POST /api/gifts/recommend
 * Body: { query: string, language?: "en" | "ar" }
 */
router.post("/recommend", async (req, res) => {
  try {
    const { query, language } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required",
        error_ar: "الاستعلام مطلوب",
      });
    }

    if (query.trim().length > 500) {
      return res.status(400).json({
        error: "Query too long (max 500 characters)",
        error_ar: "الاستعلام طويل جداً (الحد الأقصى 500 حرف)",
      });
    }

    // Step 1: Extract search hints from the query
    const hints = extractSearchHints(query);

    // Step 2: Pre-filter products
    const candidates = searchProducts(hints);

    // Step 3: Call LLM with candidates
    const llmResponse = await getGiftRecommendations(query, candidates);

    // Step 4: Validate LLM response against schema
    const validation = validateResponse(llmResponse);

    if (!validation.success) {
      console.error("Schema validation failed:", validation.errors);
      return res.status(500).json({
        error: "AI response did not match expected format. Please try again.",
        error_ar: "لم تتطابق استجابة الذكاء الاصطناعي مع التنسيق المتوقع. يرجى المحاولة مرة أخرى.",
        validation_errors: validation.errors,
      });
    }

    // Step 5: Return validated response
    return res.json({
      success: true,
      data: validation.data,
      meta: {
        candidates_searched: candidates.length,
        query_hints: hints,
      },
    });
  } catch (error) {
    console.error("Gift recommendation error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      error_ar: "خطأ داخلي في الخادم",
    });
  }
});

/**
 * GET /api/gifts/health
 */
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
