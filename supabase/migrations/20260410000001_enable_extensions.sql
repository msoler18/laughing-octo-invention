-- Migration: enable required PostgreSQL extensions
-- Depends on: nothing (first migration)
-- Run once on a fresh Supabase project.

-- pgvector: enables vector similarity search (HNSW index for RAG)
-- Required by: creator_embeddings table, semantic search endpoint
create extension if not exists vector
  with schema extensions;

-- uuid-ossp: deterministic UUID generation in PL/pgSQL triggers
create extension if not exists "uuid-ossp"
  with schema extensions;

-- pg_cron: scheduled jobs inside the DB (embedding pipeline, CSV import queue)
-- NOTE: pg_cron is pre-installed on Supabase. Enabling it here for documentation.
-- Actual job definitions go in a separate migration after all tables exist.
create extension if not exists pg_cron
  with schema pg_catalog;

-- Grant pg_cron execution to the postgres role (Supabase default)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
