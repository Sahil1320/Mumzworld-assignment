import { z } from "zod";

// Schema for a single gift recommendation from the LLM
export const GiftRecommendationSchema = z.object({
  product_id: z.number().int().positive(),
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  price: z.number().positive(),
  currency: z.literal("AED"),
  reasoning_en: z
    .string()
    .min(10, "Reasoning must be substantive, not empty filler"),
  reasoning_ar: z
    .string()
    .min(5, "Arabic reasoning must be substantive"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("How confident the model is that this product matches the query"),
  match_factors: z
    .array(z.string())
    .min(1)
    .describe("Which aspects of the query this product matches"),
});

// Schema for the full LLM response
export const GiftFinderResponseSchema = z.object({
  query_understood: z.boolean(),
  query_language: z.enum(["en", "ar", "mixed"]),
  recommendations: z
    .array(GiftRecommendationSchema)
    .max(5)
    .describe("Top product recommendations, empty if query cannot be fulfilled"),
  refusal_reason_en: z
    .string()
    .nullable()
    .describe("If query is out-of-scope or unanswerable, explain why in English"),
  refusal_reason_ar: z
    .string()
    .nullable()
    .describe("If query is out-of-scope or unanswerable, explain why in Arabic"),
  budget_note_en: z
    .string()
    .nullable()
    .describe("Note if budget is too low or no products match the price range"),
  budget_note_ar: z
    .string()
    .nullable(),
});

/**
 * Validate the LLM response against the schema.
 * Returns { success, data, errors }
 */
export function validateResponse(raw) {
  const result = GiftFinderResponseSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }
  return {
    success: false,
    data: null,
    errors: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}
