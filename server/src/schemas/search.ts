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

// Schema used by generateObject to extract hard filters from the natural language query
export const ExtractedFiltersSchema = z.object({
	city: z.string().optional().describe("Ciudad mencionada en la consulta"),
	tier: z
		.enum(["nano", "micro", "mid", "macro", "mega"])
		.optional()
		.describe("Tier de creador: nano (<10K), micro (10-100K), mid (100K-500K), macro (500K-1M), mega (>1M)"),
	followers_min: z
		.number()
		.int()
		.optional()
		.describe("Seguidores mínimos requeridos"),
	followers_max: z
		.number()
		.int()
		.optional()
		.describe("Seguidores máximos"),
	engagement_quality: z
		.enum(["zero", "low", "average", "high", "viral"])
		.optional()
		.describe("Nivel de calidad de engagement requerido"),
	category_slugs: z
		.array(z.string())
		.optional()
		.describe("Categorías de contenido (lifestyle, fitness, gaming, etc.)"),
});

export type ExtractedFilters = z.infer<typeof ExtractedFiltersSchema>;
