import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const products = JSON.parse(
  readFileSync(join(__dirname, "../data/products.json"), "utf-8")
);

/**
 * Search products by keyword, category, price range, and age.
 * Returns a filtered + scored list of candidates for the LLM to reason over.
 */
export function searchProducts({ keywords = [], category, maxPrice, minPrice, ageMonths }) {
  let results = [...products];

  // Filter by category
  if (category) {
    const cat = category.toLowerCase();
    results = results.filter(
      (p) => p.category === cat || p.tags.some((t) => t.includes(cat))
    );
  }

  // Filter by price range
  if (maxPrice !== undefined) {
    results = results.filter((p) => p.price <= maxPrice);
  }
  if (minPrice !== undefined) {
    results = results.filter((p) => p.price >= minPrice);
  }

  // Filter by age (parse age_range like "0-48 months")
  if (ageMonths !== undefined) {
    results = results.filter((p) => {
      const match = p.age_range.match(/(\d+)-(\d+)/);
      if (!match) return true; // include if age range is like "pregnancy"
      const [, low, high] = match.map(Number);
      return ageMonths >= low && ageMonths <= high;
    });
  }

  // Score by keyword relevance
  if (keywords.length > 0) {
    const kws = keywords.map((k) => k.toLowerCase());
    results = results.map((p) => {
      const searchText = `${p.name_en} ${p.name_ar} ${p.description_en} ${p.description_ar} ${p.tags.join(" ")} ${p.category}`.toLowerCase();
      let score = 0;
      for (const kw of kws) {
        if (searchText.includes(kw)) score += 1;
      }
      // Boost gift-tagged items
      if (p.tags.includes("gift")) score += 0.5;
      return { ...p, relevance_score: score };
    });
    // Sort by relevance, then rating
    results.sort((a, b) => b.relevance_score - a.relevance_score || b.rating - a.rating);
    // Keep top 15 candidates for the LLM
    results = results.filter((p) => p.relevance_score > 0).slice(0, 15);
  }

  // If no keyword matches, return top-rated gift items
  if (results.length === 0) {
    results = products
      .filter((p) => p.tags.includes("gift"))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 15);
  }

  return results;
}

/**
 * Get all products (for eval/debug)
 */
export function getAllProducts() {
  return products;
}
