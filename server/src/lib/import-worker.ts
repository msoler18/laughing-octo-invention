/**
 * CSV import worker — 5 phases:
 *   1. parse   — csv-parse (handles quoted fields, CRLF, BOM)
 *   2. sanitize — normalize column names + field values
 *   3. validate — Zod schema per row
 *   4. upsert  — ON CONFLICT (instagram_handle) DO UPDATE SET …
 *   5. finalize — update import_jobs with outcome
 */

import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { importJobs } from "../db/schema/import-jobs.js";
import { creators } from "../db/schema/creators.js";

// ── Phase 2: column name normalisation map ────────────────────────────────────
// Keys: possible CSV header variants (lower-cased, trimmed).
// Values: canonical camelCase field name matching CreateCreatorSchema.

const COLUMN_MAP: Record<string, string> = {
	instagram_handle:          "instagramHandle",
	handle:                    "instagramHandle",
	full_name:                 "fullName",
	name:                      "fullName",
	phone:                     "phone",
	email:                     "email",
	country:                   "country",
	city:                      "city",
	followers_count:           "followersCount",
	followers:                 "followersCount",
	engagement_rate:           "engagementRate",
	engagment_rate:            "engagementRate",   // common typo in source data
	avg_likes_last_10:         "avgLikesLast10",
	reach_rate:                "reachRate",
	creator_tier:              "creatorTier",
	tier:                      "creatorTier",
	engagement_quality:        "engagementQuality",
	consistency_score:         "consistencyScore",
	audience_quality_score:    "audienceQualityScore",
	bio_text:                  "bioText",
	bio:                       "bioText",
	content_language:          "contentLanguage",
	dominant_format:           "dominantFormat",
	tiktok_handle:             "tiktokHandle",
	brand_mentions_last_30_posts: "brandMentionsLast30Posts",
	bio_keywords:              "bioKeywords",
	content_rate_usd:          "contentRateUsd",
	payment_method:            "paymentMethod",
	onboarding_status:         "onboardingStatus",
	campaigns_participated:    "campaignsParticipated",
	notes:                     "notes",
	tags:                      "tags",
	gdpr_consent_at:           "gdprConsentAt",
};

// ── Phase 3: per-row Zod schema ───────────────────────────────────────────────
// More lenient than CreateCreatorSchema: everything comes in as string from CSV.

const CsvRowSchema = z.object({
	instagramHandle: z.string().min(1).max(255),
	fullName:        z.string().min(1).max(255),
	phone:           z.string().max(50).optional(),
	email:           z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
	country:         z.string().max(100).optional(),
	city:            z.string().max(100).optional(),

	followersCount:  z.coerce.number().int().min(0).default(0),
	engagementRate:  z.coerce.number().min(0).default(0),
	avgLikesLast10:  z.coerce.number().min(0).optional(),
	reachRate:       z.coerce.number().min(0).optional(),

	creatorTier:      z
		.enum(["nano", "micro", "mid", "macro", "mega"])
		.default("nano"),
	engagementQuality: z
		.enum(["zero", "low", "average", "high", "viral"])
		.default("zero"),

	consistencyScore:     z.coerce.number().min(0).max(100).optional(),
	audienceQualityScore: z.coerce.number().min(0).max(100).optional(),

	bioText:          z.string().optional(),
	contentLanguage:  z.string().max(10).optional(),
	dominantFormat:   z
		.enum(["Reels", "carousel", "photo"])
		.optional()
		.or(z.literal(""))
		.transform(v => v || undefined),
	tiktokHandle:     z.string().max(255).optional(),
	brandMentionsLast30Posts: z.coerce.number().int().min(0).default(0),
	// bioKeywords and tags come as semicolon-separated strings from CSV
	bioKeywords:      z.string().optional().transform(v =>
		v ? v.split(";").map(k => k.trim()).filter(Boolean) : undefined,
	),
	tags:             z.string().optional().transform(v =>
		v ? v.split(";").map(t => t.trim()).filter(Boolean) : [],
	),

	contentRateUsd:   z.coerce.number().min(0).optional(),
	paymentMethod:    z.string().max(100).optional(),
	onboardingStatus: z.string().max(100).optional(),
	campaignsParticipated: z.coerce.number().int().min(0).default(0),
	notes:            z.string().optional(),
	gdprConsentAt:    z.string().optional().transform(v => v || undefined),
});

type CsvRow = z.infer<typeof CsvRowSchema>;

// ── Sanitize a single raw column value ───────────────────────────────────────

function sanitizeValue(field: string, raw: string): string {
	const v = raw.trim();
	if (field === "instagramHandle") {
		// Strip leading @ sign if present
		return v.startsWith("@") ? v.slice(1) : v;
	}
	if (field === "followersCount" || field === "campaignsParticipated") {
		// Remove thousands separators: "1,317" → "1317"
		return v.replace(/,/g, "");
	}
	if (field === "engagementRate" || field === "consistencyScore" || field === "audienceQualityScore") {
		// Remove % sign if present: "4.5%" → "4.5"
		return v.replace(/%$/, "");
	}
	if (field === "bioKeywords" || field === "tags") {
		// Normalise "&" separator to ";" for uniform splitting
		return v.replace(/\s*&\s*/g, ";");
	}
	return v;
}

// ── Main worker function ──────────────────────────────────────────────────────

export async function processImportJob(jobId: string, csvContent: string): Promise<void> {
	// Mark as processing
	await db
		.update(importJobs)
		.set({ status: "processing" })
		.where(eq(importJobs.id, jobId));

	const errorLog: Array<{ row: number; error: string }> = [];
	let rowsProcessed = 0;
	let rowsSkipped = 0;

	try {
		// ── Phase 1: parse ────────────────────────────────────────────────────
		// Strip BOM if present
		const csv = csvContent.replace(/^\uFEFF/, "");
		const rawRows: Record<string, string>[] = parse(csv, {
			columns:          true,   // first row = headers
			skip_empty_lines: true,
			trim:             true,
			relax_column_count: true,
		});

		for (let i = 0; i < rawRows.length; i++) {
			const rowNumber = i + 2; // 1-indexed + header row
			const rawRow = rawRows[i];

			try {
				// ── Phase 2: sanitize ─────────────────────────────────────────
				if (!rawRow) { rowsSkipped++; continue; }
				const normalised: Record<string, string | undefined> = {};
				for (const [rawKey, rawVal] of Object.entries(rawRow)) {
					const canonical = COLUMN_MAP[rawKey.toLowerCase().trim()];
					if (canonical) {
						normalised[canonical] = sanitizeValue(canonical, rawVal ?? "");
					}
					// Unknown columns are silently dropped
				}

				// ── Phase 3: validate ─────────────────────────────────────────
				const parsed = CsvRowSchema.safeParse(normalised);
				if (!parsed.success) {
					const message = parsed.error.issues
						.map(e => `${e.path.join(".")}: ${e.message}`)
						.join("; ");
					errorLog.push({ row: rowNumber, error: message });
					rowsSkipped++;
					continue;
				}

				const data: CsvRow = parsed.data;

				// ── Phase 4: upsert ───────────────────────────────────────────
				await db
					.insert(creators)
					.values({
						...data,
						engagementRate:      String(data.engagementRate),
						avgLikesLast10:      data.avgLikesLast10 !== undefined ? String(data.avgLikesLast10) : undefined,
						reachRate:           data.reachRate !== undefined ? String(data.reachRate) : undefined,
						consistencyScore:    data.consistencyScore !== undefined ? String(data.consistencyScore) : undefined,
						audienceQualityScore: data.audienceQualityScore !== undefined ? String(data.audienceQualityScore) : undefined,
						contentRateUsd:      data.contentRateUsd !== undefined ? String(data.contentRateUsd) : undefined,
						gdprConsentAt:       data.gdprConsentAt ? new Date(data.gdprConsentAt) : undefined,
					})
					.onConflictDoUpdate({
						target: creators.instagramHandle,
						set: {
							fullName:            data.fullName,
							phone:               data.phone,
							country:             data.country,
							city:                data.city,
							followersCount:      data.followersCount,
							engagementRate:      String(data.engagementRate),
							avgLikesLast10:      data.avgLikesLast10 !== undefined ? String(data.avgLikesLast10) : undefined,
							reachRate:           data.reachRate !== undefined ? String(data.reachRate) : undefined,
							creatorTier:         data.creatorTier,
							engagementQuality:   data.engagementQuality,
							consistencyScore:    data.consistencyScore !== undefined ? String(data.consistencyScore) : undefined,
							bioText:             data.bioText,
							contentLanguage:     data.contentLanguage,
							dominantFormat:      data.dominantFormat,
							tiktokHandle:        data.tiktokHandle,
							brandMentionsLast30Posts: data.brandMentionsLast30Posts,
							bioKeywords:         data.bioKeywords,
							notes:               data.notes,
							tags:                data.tags,
							// Invalidate embedding on upsert so pg_cron re-vectorizes
							embeddingUpdatedAt:  null,
							updatedAt:           new Date(),
						},
					});

				rowsProcessed++;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				errorLog.push({ row: rowNumber, error: message });
				rowsSkipped++;
			}
		}

		// ── Phase 5: finalize ─────────────────────────────────────────────────
		await db
			.update(importJobs)
			.set({
				status:         "done",
				rowsProcessed,
				rowsSkipped,
				errorLog,
				completedAt:    new Date(),
			})
			.where(eq(importJobs.id, jobId));

	} catch (err) {
		// Fatal parse error — mark whole job as failed
		const message = err instanceof Error ? err.message : String(err);
		await db
			.update(importJobs)
			.set({
				status:      "failed",
				rowsSkipped,
				errorLog:    [{ row: 0, error: message }],
				completedAt: new Date(),
			})
			.where(eq(importJobs.id, jobId));
	}
}
