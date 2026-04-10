import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

export type CronJobStatus = {
	[key: string]: unknown;
	jobname: string;
	schedule: string;
	active: boolean;
	last_run_at: string | null;
	next_run_at: string | null;
}

async function cronPlugin(app: FastifyInstance) {
	// Expose cron job status on GET /api/v1/cron/status
	// Useful for monitoring and smoke tests post-deploy (M7-14).
	app.get(
		"/cron/status",
		{
			schema: {
				tags: ["health"],
				summary: "pg_cron job status",
				description:
					"Returns the current status of all registered pg_cron jobs.",
				response: {
					200: {
						type: "object",
						properties: {
							jobs: {
								type: "array",
								items: {
									type: "object",
									properties: {
										jobname: { type: "string" },
										schedule: { type: "string" },
										active: { type: "boolean" },
										last_run_at: { type: ["string", "null"] },
										next_run_at: { type: ["string", "null"] },
									},
								},
							},
						},
					},
				},
			},
		},
		async () => {
			const rows = await db.execute<CronJobStatus>(sql`
        select
          j.jobname,
          j.schedule,
          j.active,
          d.start_time::text as last_run_at,
          (
            select min(s.scheduled_time)::text
            from cron.job_run_details s
            where s.jobid = j.jobid
              and s.status = 'starting'
              and s.scheduled_time > now()
          ) as next_run_at
        from cron.job j
        left join lateral (
          select start_time
          from cron.job_run_details
          where jobid = j.jobid
          order by start_time desc
          limit 1
        ) d on true
        where j.jobname in ('process-pending-embeddings', 'process-csv-imports')
        order by j.jobname
      `);

			return { jobs: rows };
		},
	);
}

export default fp(cronPlugin, { name: "cron", dependencies: ["swagger"] });
