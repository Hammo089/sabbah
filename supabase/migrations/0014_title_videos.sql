-- =============================================================================
-- 0014 — TITLE VIDEOS
--
-- The detail page needs more than one video per title: the trailer, plus
-- teasers, opening titles, behind-the-scenes and clips. Until now `series`
-- carried a single `trailer_url` / `youtube_id`, so everything else had
-- nowhere to live.
--
-- One row per video. Either a YouTube id or a direct file URL — never both
-- required, but at least one must be present, enforced by CHECK.
-- =============================================================================

do $$ begin
  create type public.video_kind as enum
    ('trailer', 'teaser', 'clip', 'opening', 'behind_scenes', 'interview', 'promo');
exception when duplicate_object then null; end $$;

create table if not exists public.title_videos (
  id            uuid primary key default gen_random_uuid(),
  series_id     uuid references public.series(id) on delete cascade,
  movie_id      uuid references public.movies(id) on delete cascade,
  kind          public.video_kind not null default 'trailer',
  label         jsonb   not null default '{}'::jsonb,   -- per-language display name
  youtube_id    text,
  url           text,                                    -- direct file (mp4/webm) when self-hosted
  thumbnail_url text,
  duration_seconds integer,
  is_primary    boolean not null default false,          -- the one the poster play button opens
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint title_videos_one_target check (
    (series_id is not null and movie_id is null) or
    (series_id is null and movie_id is not null)
  ),
  -- A video row with no playable source is dead weight on the page.
  constraint title_videos_has_source check (
    youtube_id is not null or url is not null
  ),
  -- Same URL validation shape as 0013's brand columns.
  constraint title_videos_url_shape check (
    url is null or url ~ '^https?://[^\s<>"'']+$'
  ),
  constraint title_videos_thumb_shape check (
    thumbnail_url is null or thumbnail_url ~ '^https?://[^\s<>"'']+$'
  ),
  -- YouTube ids are exactly 11 url-safe chars; anything else is a pasted URL
  -- that the admin form failed to parse, and would render a broken iframe.
  constraint title_videos_youtube_shape check (
    youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'
  ),
  constraint title_videos_duration_sane check (
    duration_seconds is null or (duration_seconds > 0 and duration_seconds < 86400)
  )
);

create index if not exists title_videos_series_idx on public.title_videos (series_id, sort_order);
create index if not exists title_videos_movie_idx  on public.title_videos (movie_id, sort_order);

-- At most one primary video per title. Partial unique indexes give us this
-- without a trigger; two of them because the target is either/or.
create unique index if not exists title_videos_primary_series_idx
  on public.title_videos (series_id) where is_primary and series_id is not null;
create unique index if not exists title_videos_primary_movie_idx
  on public.title_videos (movie_id) where is_primary and movie_id is not null;

drop trigger if exists trg_title_videos_updated on public.title_videos;
create trigger trg_title_videos_updated
  before update on public.title_videos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — public reads (the detail page is anonymous), staff writes.
-- ---------------------------------------------------------------------------
alter table public.title_videos enable row level security;

drop policy if exists title_videos_public_read on public.title_videos;
drop policy if exists title_videos_staff_write on public.title_videos;

create policy title_videos_public_read on public.title_videos for select using (true);
create policy title_videos_staff_write on public.title_videos for all
  using (public.is_staff()) with check (public.is_staff());

grant select on public.title_videos to anon, authenticated;
grant insert, update, delete on public.title_videos to authenticated;

-- ---------------------------------------------------------------------------
-- BACKFILL — carry the existing single trailer into the new table so no title
-- loses its video. Only for rows that have one and aren't already migrated.
-- ---------------------------------------------------------------------------
insert into public.title_videos (series_id, kind, label, youtube_id, url, is_primary, sort_order)
select
  s.id,
  'trailer',
  '{"en":"Trailer","ar":"الإعلان","fr":"Bande-annonce"}'::jsonb,
  s.youtube_id,
  case when s.trailer_url ~ '^https?://' then s.trailer_url else null end,
  true,
  0
from public.series s
where (s.youtube_id is not null or s.trailer_url ~ '^https?://')
  and not exists (select 1 from public.title_videos v where v.series_id = s.id);
