-- Migration: create all MVP tables
-- Depends on: 20260410000001_enable_extensions.sql
-- Covers: M0-09 (creators), M0-10 (campaigns), M0-11 (campaign_creators),
--         M0-12 (audit_log), M0-13 (creator_scores), M0-14 (creator_embeddings),
--         M0-15 (HNSW index), M0-16 (import_jobs), M0-17 (categories + seed)

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type creator_tier as enum ('nano', 'micro', 'mid', 'macro', 'mega');
create type engagement_quality as enum ('zero', 'low', 'average', 'high', 'viral');
create type campaign_status as enum ('draft', 'active', 'closed');
create type assignment_status as enum (
  'prospecto', 'contactado', 'confirmado', 'en_brief',
  'contenido_enviado', 'aprobado', 'publicado', 'verificado', 'pagado'
);
create type audit_entity_type as enum ('creator', 'campaign', 'campaign_creator');
create type audit_action as enum ('created', 'updated', 'status_changed', 'deleted');
create type import_job_status as enum ('queued', 'processing', 'done', 'failed');

-- ─── M0-09: creators ─────────────────────────────────────────────────────────

create table creators (
  id                      uuid primary key default gen_random_uuid(),

  -- Identity
  instagram_handle        text not null unique,
  full_name               text not null,
  phone                   text,                          -- text, never numeric
  email                   text,
  country                 text,
  city                    text,

  -- Reach metrics
  followers_count         integer not null default 0,
  engagement_rate         numeric(5,2) not null default 0,
  avg_likes_last_10       numeric(10,2),
  reach_rate              numeric(5,2),

  -- Calculated fields
  creator_tier            creator_tier not null default 'nano',
  engagement_quality      engagement_quality not null default 'zero',

  -- Quality signals
  consistency_score       numeric(5,2),
  audience_quality_score  numeric(5,2),
  data_quality_flags      jsonb not null default '{}',

  -- Creator context
  bio_text                text,
  content_language        text,
  dominant_format         text,                          -- Reels | carousel | photo
  peak_activity_hours     jsonb,
  tiktok_handle           text,
  brand_mentions_last_30_posts integer default 0,
  bio_keywords            text[],

  -- Commercial (nullable from MVP)
  content_rate_usd        numeric(10,2),
  payment_method          text,
  onboarding_status       text,
  campaigns_participated  integer not null default 0,
  notes                   text,
  tags                    text[] default '{}',
  gdpr_consent_at         timestamptz,

  -- Vectorization — NULL means not yet vectorized
  embedding_updated_at    timestamptz,

  -- Timestamps
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on column creators.phone is 'Stored as text to preserve formatting. Never cast to numeric.';
comment on column creators.embedding_updated_at is 'NULL = pending vectorization. pg_cron picks these up every 5 min.';

-- ─── M0-10: campaigns ────────────────────────────────────────────────────────

create table campaigns (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  brand                 text not null,
  description           text,
  brief_text            text,
  start_date            timestamptz,
  end_date              timestamptz,
  status                campaign_status not null default 'draft',
  target_creator_count  integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── M0-11: campaign_creators (pivot) ────────────────────────────────────────

create table campaign_creators (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references campaigns(id) on delete cascade,
  creator_id          uuid not null references creators(id) on delete cascade,

  -- Lifecycle
  assignment_status   assignment_status not null default 'prospecto',
  post_url            text,                          -- required before → publicado
  notes               text,

  -- Status timestamps
  status_updated_at   timestamptz not null default now(),
  assigned_at         timestamptz not null default now(),
  confirmed_at        timestamptz,
  published_at        timestamptz,
  verified_at         timestamptz,
  paid_at             timestamptz,

  -- Post performance metrics (manual entry in MVP)
  impressions         integer,
  reach               integer,
  saves               integer,
  likes               integer,
  comments            integer,
  metrics_entered_by  text,
  metrics_entered_at  timestamptz,

  -- One creator per campaign
  unique (campaign_id, creator_id)
);

comment on column campaign_creators.post_url is 'Mandatory before transitioning to publicado. Enforced in application layer.';

-- ─── M0-12: audit_log (immutable) ────────────────────────────────────────────

create table audit_log (
  id               uuid primary key default gen_random_uuid(),
  entity_type      audit_entity_type not null,
  entity_id        uuid not null,
  action           audit_action not null,
  field_name       text,                            -- null on create/delete
  old_value        text,
  new_value        text,
  performed_by     text not null,
  performed_at     timestamptz not null default now(),
  session_context  jsonb                            -- optional: IP, user agent
);

-- Immutability guarantee: deny UPDATE and DELETE at the DB level
create rule audit_log_no_update as on update to audit_log do instead nothing;
create rule audit_log_no_delete as on delete to audit_log do instead nothing;

comment on table audit_log is 'Immutable event log. UPDATE and DELETE are blocked via SQL rules.';

-- ─── M0-13: creator_scores ───────────────────────────────────────────────────

create table creator_scores (
  id                      uuid primary key default gen_random_uuid(),
  creator_id              uuid not null unique references creators(id) on delete cascade,
  score                   numeric(5,2) not null default 0,  -- 0–100

  -- Weight breakdown (sum = score)
  engagement_weight       numeric(5,2) not null default 0,  -- 0–40
  tier_weight             numeric(5,2) not null default 0,  -- 0–30
  consistency_weight      numeric(5,2) not null default 0,  -- 0–20
  campaign_history_weight numeric(5,2) not null default 0,  -- 0–10

  calculated_at           timestamptz not null default now(),
  score_version           integer not null default 1        -- bump on formula change
);

-- ─── M0-14: creator_embeddings ───────────────────────────────────────────────

create table creator_embeddings (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null unique references creators(id) on delete cascade,

  -- 512-dimensional vector from text-embedding-3-small
  -- Privacy: phone and email are structurally excluded from source_text
  embedding    vector(512) not null,
  source_text  text not null,                       -- auditable input to the model
  model_id     text not null default 'text-embedding-3-small',

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── M0-15: HNSW index on embeddings ─────────────────────────────────────────
-- ef_search default (40) is tuned at query time via SET.
-- m=16, ef_construction=64 → good recall/build-time balance for < 100K vectors.

create index creator_embeddings_hnsw_idx
  on creator_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

comment on index creator_embeddings_hnsw_idx is
  'HNSW index for approximate nearest-neighbor cosine search. '
  'Upgrade path: increase m and ef_construction when corpus exceeds 500K vectors.';

-- ─── M0-16: import_jobs ──────────────────────────────────────────────────────

create table import_jobs (
  id              uuid primary key default gen_random_uuid(),
  filename        text not null,
  status          import_job_status not null default 'queued',
  rows_processed  integer default 0,
  rows_skipped    integer default 0,
  error_log       jsonb not null default '[]',      -- [{row, error}]
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

-- ─── M0-17: categories + creator_categories + seed ───────────────────────────

create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  parent_slug text references categories(slug) on delete set null,
  created_at  timestamptz not null default now()
);

create table creator_categories (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references creators(id) on delete cascade,
  category_slug text not null references categories(slug) on delete cascade,
  is_primary    boolean not null default false,
  subniche      text,                               -- free-text beyond two-level taxonomy
  unique (creator_id, category_slug)
);

-- Seed: base taxonomy (7 top-level + subcategories)
insert into categories (slug, name, parent_slug) values
  -- Top-level
  ('lifestyle',       'Estilo de vida',   null),
  ('gastronomia',     'Gastronomía',      null),
  ('entretenimiento', 'Entretenimiento',  null),
  ('viajes',          'Viajes',           null),
  ('tecnologia',      'Tecnología',       null),
  ('negocios',        'Negocios',         null),
  ('familia',         'Familia',          null),

  -- Lifestyle subcategories
  ('fitness',         'Fitness',          'lifestyle'),
  ('bienestar',       'Bienestar',        'lifestyle'),
  ('moda',            'Moda',             'lifestyle'),
  ('belleza',         'Belleza',          'lifestyle'),

  -- Gastronomía subcategories
  ('restaurantes',    'Restaurantes',     'gastronomia'),
  ('recetas',         'Recetas',          'gastronomia'),
  ('bebidas',         'Bebidas',          'gastronomia'),

  -- Entretenimiento subcategories
  ('musica',          'Música',           'entretenimiento'),
  ('humor',           'Humor',            'entretenimiento'),
  ('gaming',          'Gaming',           'entretenimiento'),

  -- Viajes subcategories
  ('viajes-nacional', 'Viajes nacionales','viajes'),
  ('viajes-internacional','Viajes internacionales','viajes'),
  ('viajes-ciudad',   'Viajes por ciudad','viajes'),

  -- Tecnología subcategories
  ('gadgets',         'Gadgets',          'tecnologia'),
  ('apps',            'Apps',             'tecnologia'),
  ('productividad',   'Productividad',    'tecnologia'),

  -- Negocios subcategories
  ('emprendimiento',  'Emprendimiento',   'negocios'),
  ('finanzas',        'Finanzas',         'negocios'),

  -- Familia subcategories
  ('maternidad',      'Maternidad',       'familia'),
  ('mascotas',        'Mascotas',         'familia'),
  ('educacion',       'Educación',        'familia');

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Common filter columns in /api/v1/creators
create index creators_city_idx       on creators (city);
create index creators_tier_idx       on creators (creator_tier);
create index creators_eng_qual_idx   on creators (engagement_quality);
create index creators_followers_idx  on creators (followers_count);
create index creators_embedding_pending_idx
  on creators (embedding_updated_at)
  where embedding_updated_at is null;               -- partial: only unvectorized rows

-- Campaign queries
create index campaign_creators_campaign_id_idx on campaign_creators (campaign_id);
create index campaign_creators_creator_id_idx  on campaign_creators (creator_id);
create index campaign_creators_status_idx      on campaign_creators (assignment_status);

-- Audit log lookups
create index audit_log_entity_idx on audit_log (entity_type, entity_id);
create index audit_log_performed_at_idx on audit_log (performed_at desc);

-- Import job queue polling
create index import_jobs_queued_idx on import_jobs (created_at)
  where status = 'queued';
