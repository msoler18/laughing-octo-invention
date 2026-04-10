import multipart from "@fastify/multipart";
import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { importJobs } from "../../db/schema/import-jobs.js";
import { processImportJob } from "../../lib/import-worker.js";

export default async function importRoute(app: FastifyInstance) {
	// Register multipart support scoped to this plugin
	await app.register(multipart, {
		limits: {
			fileSize: 10 * 1024 * 1024, // 10 MB max per CSV
			files: 1,
		},
	});

	// ─── M1-15  POST /import/creators ───────────────────────────────────────
	// Accepts a multipart CSV upload.
	// Creates an import_jobs record (status=queued), kicks off background
	// processing via setImmediate, and returns the job_id immediately.
	app.post(
		"/import/creators",
		{
			schema: {
				tags: ["import"],
				summary: "Upload a creators CSV and queue an import job",
				consumes: ["multipart/form-data"],
			},
		},
		async (request, reply) => {
			const file = await request.file();

			if (!file) {
				return reply.code(400).send({
					statusCode: 400,
					error: "Bad Request",
					message: "No file uploaded. Send a multipart/form-data request with a CSV field.",
				});
			}

			const filename = file.filename;
			if (!filename.toLowerCase().endsWith(".csv")) {
				return reply.code(415).send({
					statusCode: 415,
					error: "Unsupported Media Type",
					message: "Only CSV files are accepted.",
				});
			}

			// Read file content into memory
			const chunks: Buffer[] = [];
			for await (const chunk of file.file) {
				chunks.push(chunk);
			}
			const csvContent = Buffer.concat(chunks).toString("utf-8");

			// Create the job record
			const [job] = await db
				.insert(importJobs)
				.values({ filename, status: "queued" })
				.returning({ id: importJobs.id, filename: importJobs.filename });

			if (!job) throw new Error("Failed to create import job");

			// Fire-and-forget: process in background without blocking the response.
			// setImmediate defers until the current event loop tick completes.
			const jobId = job.id;
			setImmediate(() => {
				processImportJob(jobId, csvContent).catch((err) => {
					app.log.error({ jobId, err }, "Unhandled error in import worker");
				});
			});

			return reply.code(202).send({
				jobId:    job.id,
				filename: job.filename,
				status:   "queued",
			});
		},
	);

	// ─── M1-16  POST /import/process ────────────────────────────────────────
	// Called by pg_cron every 2 minutes as a safety net:
	// picks up any jobs stuck in 'queued' for > 5 min (e.g. after a restart)
	// and reprocesses them. In normal operation the setImmediate in M1-15
	// handles processing before pg_cron fires.
	app.post(
		"/import/process",
		{
			schema: {
				tags: ["import"],
				summary: "Process queued import jobs (invoked by pg_cron)",
				response: {
					200: {
						type: "object",
						properties: {
							processed: { type: "integer" },
						},
					},
				},
			},
		},
		async (_request, reply) => {
			// Find jobs queued for > 5 minutes (missed by the setImmediate handler)
			const stale = await db
				.select({ id: importJobs.id, filename: importJobs.filename })
				.from(importJobs)
				.where(
					eq(importJobs.status, "queued") &&
					sql`${importJobs.createdAt} < now() - interval '5 minutes'`,
				)
				.limit(5); // process at most 5 per tick

			// These jobs lost their in-memory CSV content — mark as failed
			// so the user knows to re-upload
			for (const job of stale) {
				await db
					.update(importJobs)
					.set({
						status:      "failed",
						errorLog:    [{ row: 0, error: "Job was requeued after a server restart. Please re-upload the CSV." }],
						completedAt: new Date(),
					})
					.where(eq(importJobs.id, job.id));
			}

			return reply.send({ processed: stale.length });
		},
	);

	// ─── M1-17  GET /import/:jobId ───────────────────────────────────────────
	// Polling endpoint for the frontend: returns job status + progress.
	app.get(
		"/import/:jobId",
		{
			schema: {
				tags: ["import"],
				summary: "Get import job status",
				params: {
					type: "object",
					required: ["jobId"],
					properties: { jobId: { type: "string", format: "uuid" } },
				},
			},
		},
		async (request, reply) => {
			const { jobId } = request.params as { jobId: string };

			const [job] = await db
				.select()
				.from(importJobs)
				.where(eq(importJobs.id, jobId));

			if (!job) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Import job ${jobId} not found`,
				});
			}

			return reply.send(job);
		},
	);
}
