import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Mumzworld Gift Finder, an AI assistant for the largest mother & baby e-commerce platform in the Middle East.

ROLE: Help moms (and gift-givers) find the perfect gift from our product catalog.

RULES:
1. ONLY recommend products from the provided catalog. Never invent products.
2. Return structured JSON matching the exact schema requested.
3. Provide reasoning for each recommendation that references specific product features.
4. Support both English and Arabic queries. Respond in BOTH languages always.
5. Arabic text must read naturally — not like a machine translation.
6. Include a confidence score (0-1) for each recommendation based on how well it matches.
7. If the query is out of scope (not about baby/mom products, asking medical advice, inappropriate), set query_understood to false and provide a polite refusal in both languages.
8. If no products match the criteria, return empty recommendations with a helpful budget_note.
9. If the query is vague, do your best but lower confidence scores and note the ambiguity.
10. NEVER fabricate product details, prices, or features not in the catalog data.

OUT OF SCOPE (refuse politely):
- Medical advice or diagnosis
- Non-baby/mom product requests (electronics, furniture for adults, etc.)
- Requests with harmful or inappropriate content
- Questions about competitor products or pricing`;

const RESPONSE_FORMAT_INSTRUCTION = `
Respond with ONLY valid JSON in this exact format:
{
  "query_understood": boolean,
  "query_language": "en" | "ar" | "mixed",
  "recommendations": [
    {
      "product_id": number,
      "name_en": "string",
      "name_ar": "string",
      "price": number,
      "currency": "AED",
      "reasoning_en": "string explaining why this is a good match",
      "reasoning_ar": "string — natural Arabic reasoning, NOT a translation",
      "confidence": number between 0 and 1,
      "match_factors": ["factor1", "factor2"]
    }
  ],
  "refusal_reason_en": null or "string if refusing",
  "refusal_reason_ar": null or "string if refusing",
  "budget_note_en": null or "string if budget issue",
  "budget_note_ar": null or "string if budget issue"
}`;

/**
 * Call the LLM with the user query and product candidates.
 * Returns the raw parsed JSON response (validated by caller).
 */
export async function getGiftRecommendations(userQuery, productCandidates) {
  const catalogContext = productCandidates.map((p) => ({
    id: p.id,
    name_en: p.name_en,
    name_ar: p.name_ar,
    category: p.category,
    price: p.price,
    currency: p.currency,
    age_range: p.age_range,
    description_en: p.description_en,
    description_ar: p.description_ar,
    rating: p.rating,
    tags: p.tags,
    in_stock: p.in_stock,
  }));

  const userMessage = `USER QUERY: "${userQuery}"

AVAILABLE PRODUCTS FROM CATALOG:
${JSON.stringify(catalogContext, null, 2)}

${RESPONSE_FORMAT_INSTRUCTION}

Remember: ONLY recommend products from the catalog above. Return up to 5 best matches. If nothing matches well, return fewer or none with a budget_note.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return JSON.parse(content);
  } catch (error) {
    // If JSON parse fails, try to extract JSON from the response
    if (error instanceof SyntaxError) {
      throw new Error(`LLM returned invalid JSON: ${error.message}`);
    }
    throw error;
  }
}
