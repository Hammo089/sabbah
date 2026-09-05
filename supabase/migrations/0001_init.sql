-- =============================================================================
-- Cedars Art Production (Sabbah Brothers) — Core Schema, RBAC & RLS
-- Target: Supabase / PostgreSQL 15+
-- File:   supabase/migrations/0001_init.sql
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

create type public.app_role as enum (
  'super_admin',
  'admin',
  'editor',
  'b2b_client',
  'viewer'
);

create type public.content_status as enum (
  'draft',
  'in_review',
  'published',
  'archived'
);

create type public.program_kind as enum (
  'show',
  'documentary',
  'format',
  'special'
);

create type public.license_status as enum (
  'available',
  'optioned',
  'licensed',
  'expired',
  'withdrawn'
);

create type public.drm_system as enum (
  'widevine',
  'fairplay',
  'playready',
  'none'
);

-- =============================================================================
-- 2. GENERIC TRIGGER FUNCTION
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 3. USERS_PROFILES
-- =============================================================================

create table public.users_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  role         public.app_role not null default 'viewer',
  company_name text,
  country_code char(2),
  phone        text,
  locale       char(2) not null default 'en',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index users_profiles_role_idx on public.users_profiles (role);

-- ---------------------------------------------------------------------------
-- RBAC helper functions (SECURITY DEFINER — bypass RLS to avoid recursion).
-- Declared AFTER users_profiles because they read from it.
-- ---------------------------------------------------------------------------

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users_profiles where id = auth.uid();
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users_profiles p
    where p.id = auth.uid()
      and p.role = any(roles)
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin', 'admin', 'editor');
$$;


create trigger trg_users_profiles_updated
  before update on public.users_profiles
  for each row execute function public.set_updated_at();

-- Auto-provision profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent privilege escalation: only super_admin may change `role`
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     -- Bypass for trusted server contexts: service_role key, SQL editor,
     -- migrations and seeds (no end-user JWT => auth.uid() is null).
     and auth.uid() is not null
     and current_user <> 'service_role'
     and not public.is_super_admin()
  then
    raise exception 'Insufficient privileges to modify role' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_guard_role_change
  before update on public.users_profiles
  for each row execute function public.guard_role_change();

-- =============================================================================
-- 4. PROGRAMS  (non-drama catalogue: shows, documentaries, formats)
-- =============================================================================

create table public.programs (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  kind               public.program_kind not null default 'show',
  title              jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  synopsis           jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  genres             text[] not null default '{}',
  year               smallint,
  duration_minutes   smallint,
  poster_url         text,
  backdrop_url       text,
  trailer_url        text,
  status             public.content_status not null default 'draft',
  is_featured_slider boolean not null default false,
  sort_order         integer not null default 0,
  seo                jsonb not null default '{}'::jsonb,
  created_by         uuid references public.users_profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index programs_status_idx   on public.programs (status);
create index programs_featured_idx on public.programs (is_featured_slider) where is_featured_slider;
create index programs_genres_idx   on public.programs using gin (genres);

create trigger trg_programs_updated
  before update on public.programs
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 5. SERIES
-- =============================================================================

create table public.series (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  synopsis           jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  genres             text[] not null default '{}',
  year               smallint,
  seasons_count      smallint not null default 1,
  episodes_count     smallint not null default 0,
  cast_members       jsonb not null default '[]'::jsonb,
  director           text,
  production_country char(2) default 'LB',
  original_language  char(2) not null default 'ar',
  poster_url         text,
  backdrop_url       text,
  trailer_url        text,
  status             public.content_status not null default 'draft',
  is_featured_slider boolean not null default false,
  sort_order         integer not null default 0,
  seo                jsonb not null default '{}'::jsonb,
  created_by         uuid references public.users_profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index series_status_idx   on public.series (status);
create index series_featured_idx on public.series (is_featured_slider) where is_featured_slider;
create index series_genres_idx   on public.series using gin (genres);
create index series_year_idx     on public.series (year desc);

create trigger trg_series_updated
  before update on public.series
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 6. MOVIES
-- =============================================================================

create table public.movies (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  synopsis           jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  genres             text[] not null default '{}',
  year               smallint,
  duration_minutes   smallint,
  cast_members       jsonb not null default '[]'::jsonb,
  director           text,
  original_language  char(2) not null default 'ar',
  poster_url         text,
  backdrop_url       text,
  trailer_url        text,
  video_url          text,
  status             public.content_status not null default 'draft',
  is_featured_slider boolean not null default false,
  sort_order         integer not null default 0,
  seo                jsonb not null default '{}'::jsonb,
  created_by         uuid references public.users_profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index movies_status_idx   on public.movies (status);
create index movies_featured_idx on public.movies (is_featured_slider) where is_featured_slider;
create index movies_genres_idx   on public.movies using gin (genres);

create trigger trg_movies_updated
  before update on public.movies
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 7. EPISODES
-- =============================================================================

create table public.episodes (
  id               uuid primary key default gen_random_uuid(),
  series_id        uuid not null references public.series(id) on delete cascade,
  season_number    smallint not null default 1,
  episode_number   smallint not null,
  title            jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  synopsis         jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  duration_seconds integer,
  thumbnail_url    text,
  video_url        text,
  hls_manifest_url text,
  subtitles        jsonb not null default '[]'::jsonb,
  air_date         date,
  status           public.content_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint episodes_unique_slot unique (series_id, season_number, episode_number)
);

create index episodes_series_idx on public.episodes (series_id, season_number, episode_number);
create index episodes_status_idx on public.episodes (status);

create trigger trg_episodes_updated
  before update on public.episodes
  for each row execute function public.set_updated_at();

-- Keep series.episodes_count in sync
create or replace function public.sync_series_episode_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.series_id, old.series_id);
begin
  update public.series s
     set episodes_count = (select count(*) from public.episodes e where e.series_id = target)
   where s.id = target;
  return null;
end;
$$;

create trigger trg_sync_episode_count
  after insert or delete on public.episodes
  for each row execute function public.sync_series_episode_count();

-- =============================================================================
-- 8. DRM_LICENSES  (RESTRICTED — super_admin only)
-- =============================================================================

create table public.drm_licenses (
  id                 uuid primary key default gen_random_uuid(),
  series_id          uuid references public.series(id) on delete cascade,
  movie_id           uuid references public.movies(id) on delete cascade,
  licensee_name      text not null,
  licensee_email     text,
  territory          text[] not null default '{}',
  rights             text[] not null default '{}',   -- e.g. {'svod','avod','linear','ppv'}
  exclusivity        boolean not null default false,
  drm                public.drm_system not null default 'widevine',
  license_key_id     text,
  license_server_url text,
  contract_ref       text,
  fee_usd            numeric(12,2),
  status             public.license_status not null default 'available',
  starts_on          date,
  ends_on            date,
  notes              text,
  created_by         uuid references public.users_profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint drm_licenses_one_target check (
    (series_id is not null and movie_id is null) or
    (series_id is null and movie_id is not null)
  )
);

create index drm_licenses_series_idx on public.drm_licenses (series_id);
create index drm_licenses_movie_idx  on public.drm_licenses (movie_id);
create index drm_licenses_status_idx on public.drm_licenses (status);

create trigger trg_drm_licenses_updated
  before update on public.drm_licenses
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 9. NEWS_TICKER
-- =============================================================================

create table public.news_ticker (
  id         uuid primary key default gen_random_uuid(),
  message    jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  link_url   text,
  priority   smallint not null default 0,
  is_active  boolean not null default true,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_ticker_active_idx on public.news_ticker (is_active, priority desc, starts_at desc);

create trigger trg_news_ticker_updated
  before update on public.news_ticker
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 10. COMPANY_LEGACY  (Our Story / 70th anniversary)
-- =============================================================================

create table public.company_legacy (
  id            uuid primary key default gen_random_uuid(),
  title         jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  description   jsonb not null default '{"en":"","ar":"","fr":""}'::jsonb,
  video_url     text,
  poster_url    text,
  year          smallint,
  is_milestone  boolean not null default true,
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index company_legacy_year_idx on public.company_legacy (year asc, sort_order asc);

create trigger trg_company_legacy_updated
  before update on public.company_legacy
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 10b. SCHEMA GRANTS
-- Supabase grants these by default, but a database built from these files
-- alone would otherwise reject every anonymous request with
-- "permission denied for schema public".
-- =============================================================================

grant usage on schema public to anon, authenticated;

grant select on
  public.series, public.movies, public.programs, public.episodes,
  public.news_ticker, public.company_legacy, public.users_profiles
  to anon;

grant select, insert, update, delete on
  public.series, public.movies, public.programs, public.episodes,
  public.news_ticker, public.company_legacy, public.users_profiles
  to authenticated;

-- drm_licenses is deliberately excluded from the anon grant; its own policy
-- further restricts it to super_admin.

-- =============================================================================
-- 11. ROW LEVEL SECURITY
-- =============================================================================

alter table public.users_profiles enable row level security;
alter table public.programs       enable row level security;
alter table public.series         enable row level security;
alter table public.movies         enable row level security;
alter table public.episodes       enable row level security;
alter table public.drm_licenses   enable row level security;
alter table public.news_ticker    enable row level security;
alter table public.company_legacy enable row level security;

alter table public.drm_licenses force row level security;

-- ---------- users_profiles -----------------------------------------------
create policy "profiles_select_self_or_staff"
  on public.users_profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update_self"
  on public.users_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_write"
  on public.users_profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------- programs / series / movies -----------------------------------
create policy "programs_public_read"
  on public.programs for select
  using (status = 'published' or public.is_staff());

create policy "programs_staff_write"
  on public.programs for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "series_public_read"
  on public.series for select
  using (status = 'published' or public.is_staff());

create policy "series_staff_write"
  on public.series for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "movies_public_read"
  on public.movies for select
  using (status = 'published' or public.is_staff());

create policy "movies_staff_write"
  on public.movies for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---------- episodes ------------------------------------------------------
create policy "episodes_public_read"
  on public.episodes for select
  using (
    public.is_staff()
    or (
      status = 'published'
      and exists (
        select 1 from public.series s
        where s.id = episodes.series_id and s.status = 'published'
      )
    )
  );

create policy "episodes_staff_write"
  on public.episodes for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---------- drm_licenses : SUPER_ADMIN ONLY -------------------------------
-- No public/anon policy exists. Any other role sees zero rows.
create policy "drm_super_admin_only"
  on public.drm_licenses for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

revoke all on public.drm_licenses from anon, authenticated;
grant select, insert, update, delete on public.drm_licenses to authenticated;

-- ---------- news_ticker ---------------------------------------------------
create policy "ticker_public_read"
  on public.news_ticker for select
  using (
    public.is_staff()
    or (is_active and starts_at <= now() and (ends_at is null or ends_at > now()))
  );

create policy "ticker_staff_write"
  on public.news_ticker for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---------- company_legacy ------------------------------------------------
create policy "legacy_public_read"
  on public.company_legacy for select
  using (is_published or public.is_staff());

create policy "legacy_staff_write"
  on public.company_legacy for all
  using (public.is_staff())
  with check (public.is_staff());

-- =============================================================================
-- 12. B2B SAFE VIEW  (licensing availability without exposing keys/fees)
-- =============================================================================

create or replace view public.b2b_available_titles
with (security_invoker = true) as
select
  s.id,
  s.slug,
  s.title,
  s.synopsis,
  s.genres,
  s.year,
  s.seasons_count,
  s.episodes_count,
  s.poster_url,
  s.original_language
from public.series s
where s.status = 'published';

grant select on public.b2b_available_titles to anon, authenticated;

-- =============================================================================
-- 13. STORAGE BUCKETS
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('posters',   'posters',   true),
  ('backdrops', 'backdrops', true),
  ('legacy',    'legacy',    true),
  ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "public_media_read"
  on storage.objects for select
  using (bucket_id in ('posters','backdrops','legacy'));

create policy "staff_media_write"
  on storage.objects for all
  using (bucket_id in ('posters','backdrops','legacy') and public.is_staff())
  with check (bucket_id in ('posters','backdrops','legacy') and public.is_staff());

create policy "contracts_super_admin_only"
  on storage.objects for all
  using (bucket_id = 'contracts' and public.is_super_admin())
  with check (bucket_id = 'contracts' and public.is_super_admin());
