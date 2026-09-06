-- =============================================================================
-- 0011 — The modules the old CAPDAMS dashboard had and this one did not, the
-- Season-Details fields from the FileMaker layout, direct user creation, and
-- account-free B2B access.
--
-- Apply AFTER 0010.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SEASON DETAILS — the fields on the CAPDAMS "Details" tab.
--    Audio / Dubbing / Subtitling are stored as arrays; the display strings
--    (English and Arabic) are GENERATED from them, so the two boxes on that
--    layout can never drift out of sync with the checkboxes above them.
-- ---------------------------------------------------------------------------
alter table public.series
  add column if not exists seas_code       text,
  add column if not exists prog_code       text,
  add column if not exists remarks         text,
  add column if not exists audio_langs     text[] not null default '{}',
  add column if not exists dubbing_langs   text[] not null default '{}',
  add column if not exists subtitling_langs text[] not null default '{}',
  add column if not exists genres_ar       text[] not null default '{}',
  add column if not exists watch_url       text,
  add column if not exists website_url     text,
  add column if not exists press_kit_url   text;

create index if not exists series_seas_code_idx on public.series (seas_code);

-- ---------------------------------------------------------------------------
-- 2. TAGS — free-form labels attachable to any title.
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  label      jsonb not null default '{}'::jsonb,
  color      text not null default '#2c845c' check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.title_tags (
  tag_id    uuid not null references public.tags(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  primary key (tag_id, series_id)
);

-- ---------------------------------------------------------------------------
-- 3. LIBRARY — physical and digital masters held per title.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.library_kind as enum
    ('master', 'mezzanine', 'proxy', 'audio', 'subtitle', 'document', 'artwork', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.library_items (
  id          uuid primary key default gen_random_uuid(),
  series_id   uuid references public.series(id) on delete cascade,
  episode_id  uuid references public.episodes(id) on delete cascade,
  kind        public.library_kind not null default 'master',
  label       text not null,
  format      text,
  resolution  text,
  duration_s  integer check (duration_s is null or duration_s >= 0),
  size_mb     numeric(12,2),
  location    text,
  barcode     text,
  file_url    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists library_items_series_idx on public.library_items (series_id);

-- ---------------------------------------------------------------------------
-- 4. MASTER SCENES — timecoded scene log per episode or title.
-- ---------------------------------------------------------------------------
create table if not exists public.master_scenes (
  id          uuid primary key default gen_random_uuid(),
  series_id   uuid references public.series(id) on delete cascade,
  episode_id  uuid references public.episodes(id) on delete cascade,
  scene_no    integer,
  tc_in       text,
  tc_out      text,
  heading     text,
  description text,
  location    text,
  characters  text[] not null default '{}',
  keywords    text[] not null default '{}',
  still_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists master_scenes_series_idx on public.master_scenes (series_id, scene_no);

-- ---------------------------------------------------------------------------
-- 5. NEWS & PRESS
-- ---------------------------------------------------------------------------
create table if not exists public.news_press (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        jsonb not null default '{}'::jsonb,
  excerpt      jsonb not null default '{}'::jsonb,
  body         jsonb not null default '{}'::jsonb,
  cover_url    text,
  outlet       text,
  external_url text,
  published_on date,
  is_published boolean not null default false,
  series_id    uuid references public.series(id) on delete set null,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists news_press_published_idx on public.news_press (is_published, published_on desc);

-- ---------------------------------------------------------------------------
-- 6. SOCIAL — one row per company account, plus scheduled/published posts.
--    Covers the Instagram / YouTube / Facebook / Twitter tiles with one table
--    instead of four near-identical ones.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.social_platform as enum
    ('instagram', 'youtube', 'facebook', 'twitter', 'tiktok', 'linkedin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('draft', 'scheduled', 'published', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.social_accounts (
  id         uuid primary key default gen_random_uuid(),
  platform   public.social_platform not null,
  handle     text not null,
  profile_url text,
  followers  integer,
  is_primary boolean not null default false,
  series_id  uuid references public.series(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, handle)
);

create table if not exists public.social_posts (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid references public.social_accounts(id) on delete cascade,
  platform    public.social_platform not null,
  series_id   uuid references public.series(id) on delete set null,
  caption     text,
  media_url   text,
  post_url    text,
  status      public.post_status not null default 'draft',
  scheduled_for timestamptz,
  published_at  timestamptz,
  likes       integer,
  comments    integer,
  views       integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists social_posts_sched_idx on public.social_posts (status, scheduled_for);

-- ---------------------------------------------------------------------------
-- 7. EXPORTS — a record of every catalogue/rights export that was generated.
-- ---------------------------------------------------------------------------
create table if not exists public.exports (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,
  format       text not null default 'pdf',
  params       jsonb not null default '{}'::jsonb,
  file_url     text,
  row_count    integer,
  requested_by uuid references public.users_profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists exports_created_idx on public.exports (created_at desc);

-- ---------------------------------------------------------------------------
-- 8. TRACKING — the audit trail. Who changed what, and when.
-- ---------------------------------------------------------------------------
create table if not exists public.tracking_events (
  id          uuid primary key default gen_random_uuid(),
  entity      text not null,
  entity_id   uuid,
  action      text not null,
  summary     text,
  meta        jsonb not null default '{}'::jsonb,
  actor_id    uuid references public.users_profiles(id) on delete set null,
  actor_email text,
  created_at  timestamptz not null default now()
);

create index if not exists tracking_created_idx on public.tracking_events (created_at desc);
create index if not exists tracking_entity_idx  on public.tracking_events (entity, entity_id);

-- ---------------------------------------------------------------------------
-- 9. NOTIFICATIONS — staff-facing alerts (expiring licence, new submission…).
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.notification_level as enum ('info', 'success', 'warning', 'danger');
exception when duplicate_object then null; end $$;

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  level      public.notification_level not null default 'info',
  title      text not null,
  body       text,
  href       text,
  audience   public.app_role,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_unread_idx on public.notifications (is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- 10. B2B LEADS — access without an account.
--     A buyer identifies themselves once (name, company, position, phone) and
--     gets the catalogue. No password, no signup, no e-mail confirmation loop.
-- ---------------------------------------------------------------------------
create table if not exists public.b2b_leads (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null check (length(btrim(full_name)) between 2 and 120),
  company     text not null check (length(btrim(company)) between 2 and 160),
  position    text not null check (length(btrim(position)) between 2 and 120),
  phone       text not null check (length(btrim(phone)) between 5 and 40),
  email       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  country     text,
  interest    text,
  downloads   integer not null default 0,
  last_seen   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists b2b_leads_created_idx on public.b2b_leads (created_at desc);

-- ---------------------------------------------------------------------------
-- 11. RLS — public reads only where the site actually renders the data;
--     everything operational is staff-only.
-- ---------------------------------------------------------------------------
alter table public.tags             enable row level security;
alter table public.title_tags       enable row level security;
alter table public.library_items    enable row level security;
alter table public.master_scenes    enable row level security;
alter table public.news_press       enable row level security;
alter table public.social_accounts  enable row level security;
alter table public.social_posts     enable row level security;
alter table public.exports          enable row level security;
alter table public.tracking_events  enable row level security;
alter table public.notifications    enable row level security;
alter table public.b2b_leads        enable row level security;

-- Public-facing: tags, published press, social accounts.
drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags for select using (true);
drop policy if exists tags_staff_write on public.tags;
create policy tags_staff_write on public.tags for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists title_tags_public_read on public.title_tags;
create policy title_tags_public_read on public.title_tags for select using (true);
drop policy if exists title_tags_staff_write on public.title_tags;
create policy title_tags_staff_write on public.title_tags for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists news_public_read on public.news_press;
create policy news_public_read on public.news_press for select
  using (is_published or public.is_staff());
drop policy if exists news_staff_write on public.news_press;
create policy news_staff_write on public.news_press for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists social_accounts_public_read on public.social_accounts;
create policy social_accounts_public_read on public.social_accounts for select using (true);
drop policy if exists social_accounts_staff_write on public.social_accounts;
create policy social_accounts_staff_write on public.social_accounts for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists social_posts_public_read on public.social_posts;
create policy social_posts_public_read on public.social_posts for select
  using (status = 'published' or public.is_staff());
drop policy if exists social_posts_staff_write on public.social_posts;
create policy social_posts_staff_write on public.social_posts for all
  using (public.is_staff()) with check (public.is_staff());

-- Operational: staff only, no public read at all.
drop policy if exists library_staff on public.library_items;
create policy library_staff on public.library_items for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists scenes_staff on public.master_scenes;
create policy scenes_staff on public.master_scenes for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists exports_staff on public.exports;
create policy exports_staff on public.exports for all
  using (public.is_staff()) with check (public.is_staff());

-- The audit trail names who did what: admins read it, editors only append to it.
drop policy if exists tracking_staff_read on public.tracking_events;
create policy tracking_staff_read on public.tracking_events for select
  using (public.has_role('super_admin', 'admin'));
drop policy if exists tracking_staff_insert on public.tracking_events;
create policy tracking_staff_insert on public.tracking_events for insert
  with check (public.is_staff());

drop policy if exists notifications_staff on public.notifications;
create policy notifications_staff on public.notifications for all
  using (public.is_staff()) with check (public.is_staff());

-- Leads: a buyer may create their own; only ADMINS may read them back. Same
-- write-only shape as script_submissions, but narrower on read: these rows are
-- a named buyer's direct phone line, which is commercial contact data, not
-- catalogue content. is_staff() would include editors — deliberately not used.
drop policy if exists leads_public_insert on public.b2b_leads;
create policy leads_public_insert on public.b2b_leads for insert
  to anon, authenticated with check (true);
drop policy if exists leads_staff_read on public.b2b_leads;
create policy leads_staff_read on public.b2b_leads for select
  using (public.has_role('super_admin', 'admin'));
drop policy if exists leads_staff_write on public.b2b_leads;
create policy leads_staff_write on public.b2b_leads for update
  using (public.has_role('super_admin', 'admin'))
  with check (public.has_role('super_admin', 'admin'));

-- ---------------------------------------------------------------------------
-- 12. GRANTS
-- ---------------------------------------------------------------------------
grant select on public.tags, public.title_tags, public.news_press,
                public.social_accounts, public.social_posts to anon, authenticated;

grant insert on public.b2b_leads to anon, authenticated;

grant select, insert, update, delete on
  public.tags, public.title_tags, public.library_items, public.master_scenes,
  public.news_press, public.social_accounts, public.social_posts, public.exports,
  public.notifications
  to authenticated;

grant select, insert on public.tracking_events to authenticated;
grant select, update on public.b2b_leads to authenticated;

-- ---------------------------------------------------------------------------
-- 13. updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'library_items','master_scenes','news_press','social_accounts','social_posts'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', tbl);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.set_updated_at()', tbl);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 14. Dashboard counters, all gated on is_staff() so a non-staff session reads
--     zeroes instead of learning how much of anything exists.
-- ---------------------------------------------------------------------------
create or replace function public.module_counts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_staff() then jsonb_build_object(
    'programs',      (select count(*) from public.programs),
    'seasons',       (select count(*) from public.series),
    'published',     (select count(*) from public.series where status = 'published'),
    'episodes',      (select count(*) from public.episodes),
    'cast',          (select count(*) from public.people),
    'broadcasters',  (select count(*) from public.broadcasters),
    'tags',          (select count(*) from public.tags),
    'library',       (select count(*) from public.library_items),
    'scenes',        (select count(*) from public.master_scenes),
    'news',          (select count(*) from public.news_press),
    'social',        (select count(*) from public.social_accounts),
    'exports',       (select count(*) from public.exports),
    'submissions',   (select count(*) from public.script_submissions where status = 'new'),
    'leads',         (select case when public.has_role('super_admin','admin')
                       then (select count(*) from public.b2b_leads) else 0 end),
    'notifications', (select count(*) from public.notifications where not is_read),
    'users',         (select count(*) from public.users_profiles),
    'drm',           (select count(*) from public.drm_licenses)
  ) else '{}'::jsonb end;
$$;

grant execute on function public.module_counts() to authenticated;

-- ---------------------------------------------------------------------------
-- 15. Seed a starter tag set so the module is not an empty screen on day one.
-- ---------------------------------------------------------------------------
insert into public.tags (slug, label, sort_order)
select * from (values
  ('ramadan',   '{"en":"Ramadan","ar":"رمضان","fr":"Ramadan"}'::jsonb, 1),
  ('prime',     '{"en":"Prime time","ar":"وقت الذروة","fr":"Prime time"}'::jsonb, 2),
  ('remake',    '{"en":"Remake","ar":"إعادة إنتاج","fr":"Remake"}'::jsonb, 3),
  ('co-prod',   '{"en":"Co-production","ar":"إنتاج مشترك","fr":"Coproduction"}'::jsonb, 4),
  ('award',     '{"en":"Award winner","ar":"حائز جوائز","fr":"Primé"}'::jsonb, 5)
) as seed(slug, label, sort_order)
where not exists (select 1 from public.tags);
