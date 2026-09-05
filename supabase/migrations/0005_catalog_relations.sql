-- =============================================================================
-- Cedars Art Production — catalogue relations
-- People (cast & crew), broadcasters, regions, posters, script library.
-- Modelled on the live sabbah.com detail page: genres, year, season, episode
-- count, country of origin, subtitle language, cast (actor + character),
-- crew (name + role), broadcaster logos, and the Watch / Episodes / Posters /
-- Cast & Crew tabs.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.title_kind as enum ('series', 'show', 'movie', 'animation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.credit_kind as enum ('cast', 'crew');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.region_code as enum ('levant', 'egypt', 'arabia', 'maghreb', 'other');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. EXTRA COLUMNS ON EXISTING CATALOGUE TABLES
-- ---------------------------------------------------------------------------

alter table public.series
  add column if not exists subtitle        jsonb   not null default '{}'::jsonb,
  add column if not exists kind            public.title_kind not null default 'series',
  add column if not exists region          public.region_code not null default 'levant',
  add column if not exists subtitle_langs  text[]  not null default '{}',
  add column if not exists is_script       boolean not null default false,
  add column if not exists is_coming_soon  boolean not null default false,
  add column if not exists is_new          boolean not null default false,
  add column if not exists is_hit          boolean not null default false,
  add column if not exists youtube_id      text;

alter table public.movies
  add column if not exists subtitle        jsonb   not null default '{}'::jsonb,
  add column if not exists region          public.region_code not null default 'levant',
  add column if not exists subtitle_langs  text[]  not null default '{}',
  add column if not exists is_coming_soon  boolean not null default false,
  add column if not exists is_new          boolean not null default false,
  add column if not exists is_hit          boolean not null default false,
  add column if not exists youtube_id      text;

create index if not exists series_kind_idx   on public.series (kind);
create index if not exists series_region_idx on public.series (region);
create index if not exists series_script_idx on public.series (is_script) where is_script;
create index if not exists series_hit_idx    on public.series (is_hit) where is_hit;

-- ---------------------------------------------------------------------------
-- 3. PEOPLE  (actors, directors, writers — one row per human)
-- ---------------------------------------------------------------------------

create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        jsonb not null default '{"ar":"","en":"","fr":""}'::jsonb,
  bio         jsonb not null default '{}'::jsonb,
  photo_url   text,
  birth_year  smallint,
  nationality char(2),
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists people_published_idx on public.people (is_published);
create index if not exists people_name_trgm on public.people
  using gin ((public.normalize_search(public.jsonb_langs_text(name))) gin_trgm_ops);

drop trigger if exists trg_people_updated on public.people;
create trigger trg_people_updated
  before update on public.people
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. CREDITS  (who worked on what, and as what)
-- ---------------------------------------------------------------------------

create table if not exists public.credits (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  series_id  uuid references public.series(id) on delete cascade,
  movie_id   uuid references public.movies(id) on delete cascade,
  kind       public.credit_kind not null default 'cast',
  role       text,            -- crew: 'Director', 'Writer', 'Director/Writer'
  character  jsonb not null default '{}'::jsonb,   -- cast: character name per language
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint credits_one_target check (
    (series_id is not null and movie_id is null) or
    (series_id is null and movie_id is not null)
  ),
  constraint credits_unique unique nulls not distinct (person_id, series_id, movie_id, kind, role)
);

create index if not exists credits_series_idx on public.credits (series_id, kind, sort_order);
create index if not exists credits_movie_idx  on public.credits (movie_id, kind, sort_order);
create index if not exists credits_person_idx on public.credits (person_id);

-- ---------------------------------------------------------------------------
-- 5. BROADCASTERS  (the platform logos on the detail page)
-- ---------------------------------------------------------------------------

create table if not exists public.broadcasters (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name      text not null,
  logo_url  text,
  site_url  text,
  sort_order integer not null default 0
);

create table if not exists public.title_broadcasters (
  broadcaster_id uuid not null references public.broadcasters(id) on delete cascade,
  series_id      uuid references public.series(id) on delete cascade,
  movie_id       uuid references public.movies(id) on delete cascade,
  constraint title_broadcasters_one_target check (
    (series_id is not null and movie_id is null) or
    (series_id is null and movie_id is not null)
  )
);

create unique index if not exists title_broadcasters_unique
  on public.title_broadcasters (broadcaster_id, coalesce(series_id, movie_id));

-- ---------------------------------------------------------------------------
-- 6. MEDIA ASSETS  (the "posters" tab: stills, posters, key art)
-- ---------------------------------------------------------------------------

create table if not exists public.media_assets (
  id         uuid primary key default gen_random_uuid(),
  series_id  uuid references public.series(id) on delete cascade,
  movie_id   uuid references public.movies(id) on delete cascade,
  url        text not null,
  caption    jsonb not null default '{}'::jsonb,
  asset_type text not null default 'poster' check (asset_type in ('poster','still','keyart','logo')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint media_assets_one_target check (
    (series_id is not null and movie_id is null) or
    (series_id is null and movie_id is not null)
  )
);

create index if not exists media_assets_series_idx on public.media_assets (series_id, sort_order);
create index if not exists media_assets_movie_idx  on public.media_assets (movie_id, sort_order);

-- ---------------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------------

alter table public.people             enable row level security;
alter table public.credits            enable row level security;
alter table public.broadcasters       enable row level security;
alter table public.title_broadcasters enable row level security;
alter table public.media_assets       enable row level security;

drop policy if exists people_public_read  on public.people;
drop policy if exists people_staff_write  on public.people;
create policy people_public_read on public.people for select
  using (is_published or public.is_staff());
create policy people_staff_write on public.people for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists credits_public_read on public.credits;
drop policy if exists credits_staff_write on public.credits;
create policy credits_public_read on public.credits for select using (true);
create policy credits_staff_write on public.credits for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists broadcasters_public_read on public.broadcasters;
drop policy if exists broadcasters_staff_write on public.broadcasters;
create policy broadcasters_public_read on public.broadcasters for select using (true);
create policy broadcasters_staff_write on public.broadcasters for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists title_broadcasters_public_read on public.title_broadcasters;
drop policy if exists title_broadcasters_staff_write on public.title_broadcasters;
create policy title_broadcasters_public_read on public.title_broadcasters for select using (true);
create policy title_broadcasters_staff_write on public.title_broadcasters for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists media_assets_public_read on public.media_assets;
drop policy if exists media_assets_staff_write on public.media_assets;
create policy media_assets_public_read on public.media_assets for select using (true);
create policy media_assets_staff_write on public.media_assets for all
  using (public.is_staff()) with check (public.is_staff());

grant select on public.people, public.credits, public.broadcasters,
                public.title_broadcasters, public.media_assets to anon, authenticated;
grant insert, update, delete on public.people, public.credits, public.broadcasters,
                public.title_broadcasters, public.media_assets to authenticated;

-- ---------------------------------------------------------------------------
-- 8. PEOPLE SEARCH  (so "تيم حسن" finds his titles)
-- ---------------------------------------------------------------------------

create or replace function public.search_people(q text, lang text default 'ar', max_results integer default 10)
returns table (id uuid, slug text, name text, photo_url text, title_count bigint)
language sql
stable
security invoker
set search_path = public
set pg_trgm.word_similarity_threshold = 0.45
as $$
  select
    p.id,
    p.slug,
    coalesce(nullif(p.name ->> lang, ''), nullif(p.name ->> 'en', ''), p.name ->> 'ar') as name,
    p.photo_url,
    (select count(*) from public.credits c where c.person_id = p.id) as title_count
  from public.people p
  where p.is_published
    -- `a <% b` = word_similarity(a, b) >= threshold. The commutator `%>` reads
    -- the arguments the other way round and silently matches nothing here.
    and public.normalize_search(q) <% public.normalize_search(public.jsonb_langs_text(p.name))
  order by title_count desc
  limit greatest(least(max_results, 50), 1);
$$;

grant execute on function public.search_people(text, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Feed cast & crew names into the title search index
-- ---------------------------------------------------------------------------

create or replace function public.reindex_title_for_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := coalesce(new.series_id, old.series_id);
  mid uuid := coalesce(new.movie_id,  old.movie_id);
begin
  if sid is not null then
    update public.series set updated_at = now() where id = sid;
  elsif mid is not null then
    update public.movies set updated_at = now() where id = mid;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_credit_reindex on public.credits;
create trigger trg_credit_reindex
  after insert or update or delete on public.credits
  for each row execute function public.reindex_title_for_credit();

-- The sync function reads series.cast_members; keep it authoritative by
-- mirroring credits into that jsonb whenever credits change.
create or replace function public.sync_cast_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := coalesce(new.series_id, old.series_id);
  mid uuid := coalesce(new.movie_id,  old.movie_id);
  names jsonb;
begin
  if sid is not null then
    select coalesce(jsonb_agg(jsonb_build_object('name', public.jsonb_langs_text(p.name))), '[]'::jsonb)
      into names
      from public.credits c join public.people p on p.id = c.person_id
     where c.series_id = sid;
    update public.series set cast_members = names where id = sid;
  elsif mid is not null then
    select coalesce(jsonb_agg(jsonb_build_object('name', public.jsonb_langs_text(p.name))), '[]'::jsonb)
      into names
      from public.credits c join public.people p on p.id = c.person_id
     where c.movie_id = mid;
    update public.movies set cast_members = names where id = mid;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_cast_members on public.credits;
create trigger trg_sync_cast_members
  after insert or update or delete on public.credits
  for each row execute function public.sync_cast_members();
