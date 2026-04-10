-- Migration: creator score auto-recalculation trigger
-- Depends on: 20260410000003_create_tables.sql
-- Covers: M0-18 (recalculate_creator_score trigger)
--
-- Scoring formula (total = 100):
--   engagement_quality  → 0–40 pts  (zero=0, low=10, average=20, high=32, viral=40)
--   creator_tier        → 0–30 pts  (nano=6, micro=12, mid=18, macro=24, mega=30)
--   consistency_score   → 0–20 pts  (raw 0–100 scaled to 0–20)
--   campaigns_participated → 0–10 pts (capped at 10 campaigns = 10 pts)

create or replace function recalculate_creator_score()
returns trigger
language plpgsql
as $$
declare
  v_engagement_weight   numeric(5,2);
  v_tier_weight         numeric(5,2);
  v_consistency_weight  numeric(5,2);
  v_history_weight      numeric(5,2);
  v_total               numeric(5,2);
begin
  -- ── Engagement quality → 40 pts ──────────────────────────────────────────
  v_engagement_weight := case new.engagement_quality
    when 'viral'   then 40
    when 'high'    then 32
    when 'average' then 20
    when 'low'     then 10
    else                  0   -- 'zero'
  end;

  -- ── Creator tier → 30 pts ────────────────────────────────────────────────
  v_tier_weight := case new.creator_tier
    when 'mega'  then 30
    when 'macro' then 24
    when 'mid'   then 18
    when 'micro' then 12
    else               6    -- 'nano'
  end;

  -- ── Consistency score → 20 pts (raw 0–100 scaled) ────────────────────────
  -- NULL consistency_score → 0 pts
  v_consistency_weight := coalesce(
    round((new.consistency_score / 100.0) * 20, 2),
    0
  );

  -- ── Campaign history → 10 pts (1 pt per campaign, max 10) ────────────────
  v_history_weight := least(new.campaigns_participated, 10)::numeric;

  v_total := v_engagement_weight
           + v_tier_weight
           + v_consistency_weight
           + v_history_weight;

  insert into creator_scores (
    creator_id,
    score,
    engagement_weight,
    tier_weight,
    consistency_weight,
    campaign_history_weight,
    calculated_at,
    score_version
  ) values (
    new.id,
    v_total,
    v_engagement_weight,
    v_tier_weight,
    v_consistency_weight,
    v_history_weight,
    now(),
    1
  )
  on conflict (creator_id) do update set
    score                   = excluded.score,
    engagement_weight       = excluded.engagement_weight,
    tier_weight             = excluded.tier_weight,
    consistency_weight      = excluded.consistency_weight,
    campaign_history_weight = excluded.campaign_history_weight,
    calculated_at           = excluded.calculated_at;
    -- score_version intentionally not bumped here; bump manually on formula change

  return new;
end;
$$;

comment on function recalculate_creator_score() is
  'Upserts a row in creator_scores after any change to the four scoring inputs on creators. '
  'score_version is NOT bumped automatically — increment it manually when the formula changes.';

create trigger trg_creator_score
  after insert or update of
    engagement_quality,
    creator_tier,
    consistency_score,
    campaigns_participated
  on creators
  for each row
  execute function recalculate_creator_score();

comment on trigger trg_creator_score on creators is
  'Fires after INSERT or targeted UPDATE on scoring columns. '
  'Keeps creator_scores in sync without a separate cron job.';
