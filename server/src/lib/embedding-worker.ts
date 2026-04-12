import { eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { creatorEmbeddings } from "../db/schema/creator-embeddings.js";
import { creators } from "../db/schema/creators.js";
import {
	EMBEDDING_MODEL_ID,
	buildEmbeddingSourceText,
	generateEmbeddings,
} from "./embedding.js";

const BATCH_SIZE = 50; // max creators vectorized per cron tick

export interface EmbeddingWorkerResult {
	processed: number;
	failed: number;
	errors: Array<{ creatorId: string; error: string }>;
}

// M4-02/M4-03 — Process up to BATCH_SIZE creators with embedding_updated_at = NULL.
// On success: upsert into creator_embeddings and set embedding_updated_at = now().
// On OpenAI failure: creator stays with embedding_updated_at = NULL and retries next tick.
export async function processEmbeddingBatch(): Promise<EmbeddingWorkerResult> {
	// Fetch pending creators — phone and email excluded at the query level (PII)
	const pending = await db
		.select({
			id: creators.id,
			instagramHandle: creators.instagramHandle,
			fullName: creators.fullName,
			country: creators.country,
			city: creators.city,
			followersCount: creators.followersCount,
			engagementRate: creators.engagementRate,
			avgLikesLast10: creators.avgLikesLast10,
			reachRate: creators.reachRate,
			creatorTier: creators.creatorTier,
			engagementQuality: creators.engagementQuality,
			consistencyScore: creators.consistencyScore,
			audienceQualityScore: creators.audienceQualityScore,
			dataQualityFlags: creators.dataQualityFlags,
			bioText: creators.bioText,
			contentLanguage: creators.contentLanguage,
			dominantFormat: creators.dominantFormat,
			peakActivityHours: creators.peakActivityHours,
			tiktokHandle: creators.tiktokHandle,
			brandMentionsLast30Posts: creators.brandMentionsLast30Posts,
			bioKeywords: creators.bioKeywords,
			contentRateUsd: creators.contentRateUsd,
			paymentMethod: creators.paymentMethod,
			onboardingStatus: creators.onboardingStatus,
			campaignsParticipated: creators.campaignsParticipated,
			notes: creators.notes,
			tags: creators.tags,
			gdprConsentAt: creators.gdprConsentAt,
			embeddingUpdatedAt: creators.embeddingUpdatedAt,
			createdAt: creators.createdAt,
			updatedAt: creators.updatedAt,
		})
		.from(creators)
		.where(isNull(creators.embeddingUpdatedAt))
		.limit(BATCH_SIZE);

	if (pending.length === 0) {
		return { processed: 0, failed: 0, errors: [] };
	}

	const sourceTexts = pending.map((c) => buildEmbeddingSourceText(c));
	const result: EmbeddingWorkerResult = { processed: 0, failed: 0, errors: [] };

	try {
		// M4-03 — single batch call; if OpenAI throws, all creators stay pending and retry next tick
		const embeddings = await generateEmbeddings(sourceTexts);

		// Upsert each embedding and mark creator as vectorized
		for (let i = 0; i < pending.length; i++) {
			const creator = pending[i];
			const embedding = embeddings[i];
			if (!creator || !embedding) continue;

			await db
				.insert(creatorEmbeddings)
				.values({
					creatorId: creator.id,
					embedding,
					sourceText: sourceTexts[i] ?? "",
					modelId: EMBEDDING_MODEL_ID,
				})
				.onConflictDoUpdate({
					target: creatorEmbeddings.creatorId,
					set: {
						embedding,
						sourceText: sourceTexts[i] ?? "",
						modelId: EMBEDDING_MODEL_ID,
						updatedAt: new Date(),
					},
				});
		}

		// Bulk-mark all processed creators as vectorized
		const processedIds = pending.map((c) => c.id);
		await db
			.update(creators)
			.set({ embeddingUpdatedAt: new Date() })
			.where(inArray(creators.id, processedIds));

		result.processed = pending.length;
	} catch (err) {
		// M4-03 — on OpenAI failure, all creators stay with embedding_updated_at = NULL
		// They will be retried on the next pg_cron tick (every 5 min).
		result.failed = pending.length;
		result.errors.push({
			creatorId: "batch",
			error: err instanceof Error ? err.message : String(err),
		});
	}

	return result;
}
