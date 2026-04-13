import { z } from "zod";

export const SearchBodySchema = z.object({
	query: z.string().min(1).max(500),
	// Optional hard filters — merged with LLM-extracted filters (LLM wins on overlap)
	filters: z
		.object({
			city: z.string().optional(),
			tier: z.enum(["nano", "micro", "mid", "macro", "mega"]).optional(),
			followers_min: z.number().int().min(0).optional(),
			followers_max: z.number().int().min(0).optional(),
			engagement_quality: z.enum(["zero", "low", "average", "high", "viral"]).optional(),
			category_slugs: z.array(z.string()).optional(),
		})
		.optional(),
	limit: z.number().int().min(1).max(50).default(20),
});

export type SearchBody = z.infer<typeof SearchBodySchema>;

// Schema used by generateObject to extract hard filters from the natural language query.
// All fields are nullable (not optional) because OpenAI structured outputs require every
// property key to appear in `required`. Use null to signal "not mentioned in query".
export const ExtractedFiltersSchema = z.object({
	city: z.string().nullable().describe("Ciudad mencionada en la consulta. null si no se menciona."),
	tier: z
		.enum(["nano", "micro", "mid", "macro", "mega"])
		.nullable()
		.describe("Tier de creador: nano (<10K), micro (10-100K), mid (100K-500K), macro (500K-1M), mega (>1M). null si no se menciona."),
	followers_min: z
		.number()
		.int()
		.nullable()
		.describe("Seguidores mínimos requeridos. null si no se menciona."),
	followers_max: z
		.number()
		.int()
		.nullable()
		.describe("Seguidores máximos. null si no se menciona."),
	engagement_quality: z
		.enum(["zero", "low", "average", "high", "viral"])
		.nullable()
		.describe("Nivel de calidad de engagement requerido. null si no se menciona."),
	category_slugs: z
		.array(z.string())
		.nullable()
		.describe("Categorías de contenido (lifestyle, fitness, gaming, etc.). null si no se menciona."),
});

export type ExtractedFilters = z.infer<typeof ExtractedFiltersSchema>;
