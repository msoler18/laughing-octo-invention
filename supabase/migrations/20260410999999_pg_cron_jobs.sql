-- Migration: register pg_cron scheduled jobs
-- Depends on: ALL table migrations (M0-09 to M0-17) and function stubs (000002)
-- This migration intentionally runs LAST (999999 suffix) to ensure all
-- tables and functions exist before job registration.
--
-- Jobs registered:
--   - process_pending_embeddings  → every 5 minutes
--   - process_csv_imports         → every 2 minutes

-- ─── Remove existing jobs (idempotent re-run safety) ──────────────────────────

select cron.unschedule('process-pending-embeddings')
where exists (
  select 1 from cron.job where jobname = 'process-pending-embeddings'
);

select cron.unschedule('process-csv-imports')
where exists (
  select 1 from cron.job where jobname = 'process-csv-imports'
);

-- ─── Embedding pipeline — every 5 minutes ────────────────────────────────────
-- Processes creators with embedding_updated_at IS NULL in batches of 50.
-- Upgrade path: replace with BullMQ+Redis worker when volume > 500 new creators/day.

select cron.schedule(
  'process-pending-embeddings',   -- job name
  '*/5 * * * *',                  -- every 5 minutes
  $$ select process_pending_embeddings(); $$
);

-- ─── CSV import queue — every 2 minutes ──────────────────────────────────────
-- Picks up the next import_job with status = 'queued' and runs the pipeline.

select cron.schedule(
  'process-csv-imports',          -- job name
  '*/2 * * * *',                  -- every 2 minutes
  $$ select process_csv_imports(); $$
);

-- ─── Verify jobs registered ───────────────────────────────────────────────────

do $$
declare
  job_count int;
begin
  select count(*) into job_count
  from cron.job
  where jobname in ('process-pending-embeddings', 'process-csv-imports');

  if job_count < 2 then
    raise exception 'pg_cron job registration failed: expected 2 jobs, found %', job_count;
  end if;

  raise notice 'pg_cron: % jobs registered successfully', job_count;
end;
$$;
