import { searchProducts } from "../services/search.js";
import { getGiftRecommendations } from "../services/llm.js";
import { validateResponse } from "../schemas/gift.js";
import dotenv from "dotenv";

dotenv.config();

const TEST_CASES = [
  // --- EASY CASES ---
  { id: 1, query: "gift for a newborn under 200 AED", expect: "recommendations", difficulty: "easy" },
  { id: 2, query: "هدية لطفل عمره 6 أشهر أقل من 300 درهم", expect: "recommendations", difficulty: "easy" },
  { id: 3, query: "premium stroller for twins", expect: "recommendations", difficulty: "easy" },
  { id: 4, query: "gift set for a new mom", expect: "recommendations", difficulty: "easy" },
  { id: 5, query: "safe car seat for infant", expect: "recommendations", difficulty: "easy" },
  // --- MEDIUM CASES ---
  { id: 6, query: "thoughtful gift for a friend with a 6-month-old, under 200 AED", expect: "recommendations", difficulty: "medium" },
  { id: 7, query: "شي حلو لأم جديدة ميزانيتي 150 درهم", expect: "recommendations", difficulty: "medium" },
  { id: 8, query: "something educational for a 2 year old", expect: "recommendations", difficulty: "medium" },
  // --- ADVERSARIAL / EDGE CASES ---
  { id: 9, query: "best laptop for gaming under 3000 AED", expect: "refusal", difficulty: "adversarial" },
  { id: 10, query: "my baby has a fever what medicine should I give", expect: "refusal", difficulty: "adversarial" },
  { id: 11, query: "gift under 10 AED", expect: "empty_or_budget_note", difficulty: "edge" },
  { id: 12, query: "", expect: "input_error", difficulty: "edge" },
  { id: 13, query: "x".repeat(600), expect: "input_error", difficulty: "edge" },
  { id: 14, query: "أريد هدية", expect: "recommendations", difficulty: "medium" },
];

async function runEvals() {
  console.log("🧪 Running Gift Finder Evaluation Suite\n");
  console.log("=".repeat(60));

  const results = [];

  for (const tc of TEST_CASES) {
    // Skip input validation tests (those are API-level)
    if (tc.expect === "input_error") {
      console.log(`\n[#${tc.id}] SKIP — Input validation (tested at API level)`);
      results.push({ ...tc, status: "SKIP", reason: "API-level test" });
      continue;
    }

    console.log(`\n[#${tc.id}] ${tc.difficulty.toUpperCase()} | "${tc.query.substring(0, 60)}..."`);

    try {
      const hints = extractSearchHintsForEval(tc.query);
      const candidates = searchProducts(hints);
      const llmResponse = await getGiftRecommendations(tc.query, candidates);
      const validation = validateResponse(llmResponse);

      let status = "FAIL";
      let reason = "";

      if (!validation.success) {
        reason = `Schema validation failed: ${JSON.stringify(validation.errors)}`;
      } else {
        const data = validation.data;
        if (tc.expect === "refusal") {
          status = !data.query_understood || data.refusal_reason_en ? "PASS" : "FAIL";
          reason = status === "PASS" ? "Correctly refused" : "Should have refused but didn't";
        } else if (tc.expect === "empty_or_budget_note") {
          status = data.recommendations.length === 0 || data.budget_note_en ? "PASS" : "FAIL";
          reason = status === "PASS" ? "Correctly handled edge case" : "Missing budget note";
        } else {
          status = data.recommendations.length > 0 && data.query_understood ? "PASS" : "FAIL";
          reason = `${data.recommendations.length} recommendations, avg confidence: ${(data.recommendations.reduce((a, r) => a + r.confidence, 0) / (data.recommendations.length || 1)).toFixed(2)}`;
        }
      }

      console.log(`   → ${status}: ${reason}`);
      results.push({ ...tc, status, reason });
    } catch (error) {
      console.log(`   → ERROR: ${error.message}`);
      results.push({ ...tc, status: "ERROR", reason: error.message });
    }

    // Rate limiting pause
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 EVALUATION SUMMARY\n");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  const err = results.filter((r) => r.status === "ERROR").length;
  const total = results.length - skip;
  console.log(`   PASS: ${pass}/${total}`);
  console.log(`   FAIL: ${fail}/${total}`);
  console.log(`   ERROR: ${err}/${total}`);
  console.log(`   SKIP: ${skip}`);
  console.log(`   Score: ${((pass / total) * 100).toFixed(1)}%`);
  console.log("\n" + "=".repeat(60));
}

function extractSearchHintsForEval(query) {
  const q = query.toLowerCase();
  const hints = { keywords: [], maxPrice: undefined, ageMonths: undefined };
  const priceMatch = q.match(/(?:under|below|less than|أقل من|تحت)\s*(\d+)/);
  if (priceMatch) hints.maxPrice = parseInt(priceMatch[1]);
  const ageMonthMatch = q.match(/(\d+)\s*(?:month|شهر)/);
  if (ageMonthMatch) hints.ageMonths = parseInt(ageMonthMatch[1]);
  const ageYearMatch = q.match(/(\d+)\s*(?:year|سنة|سنوات)/);
  if (ageYearMatch) hints.ageMonths = parseInt(ageYearMatch[1]) * 12;
  if (q.includes("newborn") || q.includes("مولود")) hints.ageMonths = 1;
  hints.keywords = q.split(/\s+/).filter((w) => w.length > 2);
  return hints;
}

runEvals().catch(console.error);
