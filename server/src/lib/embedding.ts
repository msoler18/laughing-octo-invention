import OpenAI from "openai";
import type { Creator } from "../db/schema/creators.js";

// M4-01 — compose structured text for vectorization.
// Phone and email are structurally excluded via TypeScript Omit
// to prevent PII from ever entering the embedding index.
type EmbeddableCreator = Omit<Creator, "phone" | "email">;

export function buildEmbeddingSourceText(creator: EmbeddableCreator): string {
	const parts: string[] = [];

	parts.push(`Nombre: ${creator.fullName}`);
	parts.push(`Handle: @${creator.instagramHandle}`);

	if (creator.city) parts.push(`Ciudad: ${creator.city}`);
	if (creator.country) parts.push(`País: ${creator.country}`);

	parts.push(`Tier: ${creator.creatorTier}`);
	parts.push(`Seguidores: ${creator.followersCount}`);
	parts.push(`Engagement rate: ${creator.engagementRate}%`);
	parts.push(`Calidad de engagement: ${creator.engagementQuality}`);

	if (creator.bioText) parts.push(`Bio: ${creator.bioText}`);
	if (creator.dominantFormat) parts.push(`Formato principal: ${creator.dominantFormat}`);
	if (creator.contentLanguage) parts.push(`Idioma: ${creator.contentLanguage}`);
	if (creator.bioKeywords?.length) {
		parts.push(`Palabras clave: ${creator.bioKeywords.join(", ")}`);
	}

	if (creator.consistencyScore) {
		parts.push(`Consistencia: ${creator.consistencyScore}`);
	}
	if (creator.campaignsParticipated > 0) {
		parts.push(`Campañas participadas: ${creator.campaignsParticipated}`);
	}

	return parts.join(". ");
}

export const EMBEDDING_MODEL_ID = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512; // matches creator_embeddings vector(512) schema

// Lazy singleton — reads OPENAI_API_KEY from env at first call
let _client: OpenAI | null = null;
function getClient(): OpenAI {
	if (!_client) _client = new OpenAI();
	return _client;
}

export async function generateEmbedding(text: string): Promise<number[]> {
	const res = await getClient().embeddings.create({
		model: EMBEDDING_MODEL_ID,
		input: text,
		dimensions: EMBEDDING_DIMENSIONS,
	});
	return res.data[0]?.embedding ?? [];
}

// Batch — up to 2048 texts per call (OpenAI limit)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
	const res = await getClient().embeddings.create({
		model: EMBEDDING_MODEL_ID,
		input: texts,
		dimensions: EMBEDDING_DIMENSIONS,
	});
	// Response order matches input order per OpenAI spec
	return res.data.map((d) => d.embedding);
}
