-- Migration: pg_cron permissions and job registration helpers
-- Depends on: 20260410000001_enable_extensions.sql
--
-- pg_cron is pre-installed and enabled in Supabase Pro/Free tiers.
-- This migration configures the execution permissions and creates the
-- stub functions that the scheduled jobs will invoke.
-- The actual cron.schedule() calls live in 20260410999999_pg_cron_jobs.sql
-- which runs AFTER all table migrations (M0-09 to M0-17).

-- ─── Permissions ─────────────────────────────────────────────────────────────

-- Allow the postgres role to manage cron jobs
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- ─── Embedding pipeline stub ──────────────────────────────────────────────────
-- Processes creators with embedding_updated_at IS NULL in batches of 50.
-- Full implementation added in M4-02 (after creator_embeddings table exists).

create or replace function process_pending_embeddings()
returns void
language plpgsql
security definer
as $$
begin
  -- Stub: replaced in M4-02 migration with the full pgvector batch logic.
  -- When implemented, this function will:
  --   1. SELECT up to 50 creators WHERE embedding_updated_at IS NULL
  --   2. Call pg_net to POST to the embedding worker endpoint
  --   3. Update embedding_updated_at on success
  raise notice 'process_pending_embeddings: stub — implement in M4-02';
end;
$$;

comment on function process_pending_embeddings() is
  'Batch-processes up to 50 creators lacking a current embedding vector. '
  'Invoked by pg_cron every 5 minutes. Stub until M4-02.';

-- ─── CSV import queue stub ───────────────────────────────────────────────────
-- Picks up import_jobs with status = ''queued'' and processes them.
-- Full implementation added in M1-16 (after import_jobs table exists).

create or replace function process_csv_imports()
returns void
language plpgsql
security definer
as $$
begin
  -- Stub: replaced in M1-16 migration with the full CSV pipeline logic.
  -- When implemented, this function will:
  --   1. SELECT 1 import_job WHERE status = 'queued' ORDER BY created_at ASC
  --   2. Mark it as 'processing'
  --   3. Call the 5-phase CSV pipeline (parse → sanitize → validate → upsert → report)
  raise notice 'process_csv_imports: stub — implement in M1-16';
end;
$$;

comment on function process_csv_imports() is
  'Picks up the next queued CSV import job and processes it through the '
  '5-phase pipeline. Invoked by pg_cron every 2 minutes. Stub until M1-16.';
