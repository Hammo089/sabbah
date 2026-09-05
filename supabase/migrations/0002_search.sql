-- =============================================================================
-- Cedars Art Production — Trilingual smart search (AR / EN / FR)
-- File: supabase/migrations/0002_search.sql
--
-- Design:
--   * normalize_search()  — folds Arabic orthography (hamza forms, ta marbuta,
--     alef maqsura, tashkeel, tatweel, Arabic-Indic digits) and Latin accents.
--     Without this, "الهِيبَة" and "الهيبه" are different strings and the user
--     who types the second finds nothing.
--   * latin_skeleton()    — Arabic → Latin consonant skeleton, so a visitor
--     typing Arabizi ("7ayba", "3arous beyrouth", "5amse w nos") still lands on
--     the Arabic title. Long vowels و/ي are dropped because Latin typists spell
--     them as u/o/i/e.
--   * search_index        — one denormalized, trigger-maintained row per title,
--     carrying a weighted tsvector plus trigram-indexed text for typo tolerance.
--   * search_catalog()    — SECURITY INVOKER, so RLS decides what anonymous
--     visitors may see. Draft titles never surface.
-- =============================================================================

create extension if not exists pg_trgm;

-- =============================================================================
-- 1. NORMALIZATION
-- =============================================================================

create or replace function public.normalize_search(input text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
    translate(
      regexp_replace(
        translate(
          lower(coalesce(input, '')),
          'أإآٱىةؤئي' || '٠١٢٣٤٥٦٧٨٩' || 'àâäáãçéèêëíìîïñóòôöõúùûüýÿ',
          'اااايهويي' || '0123456789' || 'aaaaaceeeeiiiinooooouuuuyy'
        ),
        '[ً-ٰٟـ‌‍ۖ-ۭ]', '', 'g'   -- tashkeel, tatweel, superscript alef, ZWNJ/ZWJ
      ),
      '.,;:!?"''`()[]{}<>/\|@#$%^&*_+=~«»""''،؛؟-–—',
      '                                             '
    ),
    '\s+', ' ', 'g'
  );
$$;

comment on function public.normalize_search(text) is
  'Orthography-folding normalizer: unifies Arabic hamza/ta-marbuta/alef-maqsura, strips tashkeel and tatweel, converts Arabic-Indic digits, folds Latin accents.';

create or replace function public.latin_skeleton(input text)
returns text
language sql
immutable
parallel safe
as $$
  with normalized as (select public.normalize_search(input) as t),
  arabizi_multi as (select replace(replace(t, '5', 'kh'), '4', 'th') as t from normalized),
  arabizi as (select translate(t, '7239', 'haas') as t from arabizi_multi),
  digraphs as (
    select replace(replace(replace(replace(replace(replace(
             t, 'ث','th'), 'خ','kh'), 'ذ','th'), 'ش','sh'), 'غ','gh'), 'ص','s') as t
    from arabizi
  ),
  single as (
    select translate(t, 'ابتجحدرزسضطعفقكلمنهوي', 'abtjhdrzsdtafqklmnhwy') as t
    from digraphs
  )
  select regexp_replace(
           regexp_replace(translate(t, 'aeiouwy', '       '), '\s+', '', 'g'),
           '(.)\1+', '\1', 'g')
  from single;
$$;

-- Strips the Arabic definite article so "الهيبة" indexes as "hbh", letting a
-- visitor who types "hayba" (skeleton "hb") match on a prefix.
create or replace function public.latin_skeleton_title(input text)
returns text
language sql
immutable
parallel safe
as $$
  select public.latin_skeleton(
    regexp_replace(public.normalize_search(input), '(^|\s)ال', '\1', 'g')
  );
$$;

comment on function public.latin_skeleton(text) is
  'Arabic-to-Latin consonant skeleton for cross-script (Arabizi) matching.';

-- Helper: flatten a localized jsonb column into one normalized string.
create or replace function public.jsonb_langs_text(doc jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(
    trim(concat_ws(' ',
      nullif(doc ->> 'ar', ''),
      nullif(doc ->> 'en', ''),
      nullif(doc ->> 'fr', '')
    )), '');
$$;

-- =============================================================================
-- 2. SEARCH INDEX
-- =============================================================================

create table if not exists public.search_index (
  entity_type    text not null check (entity_type in ('series', 'movie', 'program')),
  entity_id      uuid not null,
  slug           text not null,
  title          jsonb not null,
  synopsis       jsonb not null default '{}'::jsonb,
  poster_url     text,
  year           smallint,
  genres         text[] not null default '{}',
  status         public.content_status not null,

  title_norm     text not null,
  body_norm      text not null default '',
  skeleton       text not null default '',

  tsv            tsvector,
  updated_at     timestamptz not null default now(),

  primary key (entity_type, entity_id)
);

create index if not exists search_index_tsv_idx      on public.search_index using gin (tsv);
create index if not exists search_index_title_trgm   on public.search_index using gin (title_norm gin_trgm_ops);
create index if not exists search_index_body_trgm  on public.search_index using gin (body_norm gin_trgm_ops);
create index if not exists search_index_skeleton_trgm on public.search_index using gin (skeleton gin_trgm_ops);
-- Every branch of the search predicate must be index-sargable. A single
-- unindexed OR branch (body_norm was one) forces a sequential scan of the
-- whole table and the planner ignores all the other indexes.
create index if not exists search_index_status_idx   on public.search_index (status);
create index if not exists search_index_genres_idx   on public.search_index using gin (genres);

-- =============================================================================
-- 3. TRIGGER SYNC
-- =============================================================================

create or replace function public.sync_search_index()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text := case tg_table_name
                 when 'series'   then 'series'
                 when 'movies'   then 'movie'
                 when 'programs' then 'program'
               end;
  title_flat text;
  body_flat  text;
  cast_flat  text := '';
begin
  if tg_op = 'DELETE' then
    delete from public.search_index where entity_type = kind and entity_id = old.id;
    return old;
  end if;

  title_flat := public.jsonb_langs_text(new.title);
  body_flat  := public.jsonb_langs_text(new.synopsis);

  -- cast_members is jsonb array of {name} objects (series/movies only)
  if tg_table_name in ('series', 'movies') then
    select coalesce(string_agg(value ->> 'name', ' '), '')
      into cast_flat
      from jsonb_array_elements(
        case when jsonb_typeof(new.cast_members) = 'array' then new.cast_members else '[]'::jsonb end
      );
  end if;

  insert into public.search_index as si (
    entity_type, entity_id, slug, title, synopsis, poster_url, year, genres, status,
    title_norm, body_norm, skeleton, tsv, updated_at
  )
  values (
    kind,
    new.id,
    new.slug,
    new.title,
    new.synopsis,
    new.poster_url,
    new.year,
    new.genres,
    new.status,
    public.normalize_search(title_flat),
    public.normalize_search(concat_ws(' ', body_flat, cast_flat, array_to_string(new.genres, ' '))),
    public.latin_skeleton_title(coalesce(new.title ->> 'ar', title_flat)),
    setweight(to_tsvector('simple', public.normalize_search(title_flat)), 'A')
      || setweight(to_tsvector('simple', public.normalize_search(cast_flat)), 'B')
      || setweight(to_tsvector('simple', public.normalize_search(array_to_string(new.genres, ' '))), 'B')
      || setweight(to_tsvector('simple', public.normalize_search(body_flat)), 'C'),
    now()
  )
  on conflict (entity_type, entity_id) do update set
    slug = excluded.slug,
    title = excluded.title,
    synopsis = excluded.synopsis,
    poster_url = excluded.poster_url,
    year = excluded.year,
    genres = excluded.genres,
    status = excluded.status,
    title_norm = excluded.title_norm,
    body_norm = excluded.body_norm,
    skeleton = excluded.skeleton,
    tsv = excluded.tsv,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_search_sync_series   on public.series;
drop trigger if exists trg_search_sync_movies   on public.movies;
drop trigger if exists trg_search_sync_programs on public.programs;

create trigger trg_search_sync_series
  after insert or update or delete on public.series
  for each row execute function public.sync_search_index();

create trigger trg_search_sync_movies
  after insert or update or delete on public.movies
  for each row execute function public.sync_search_index();

create trigger trg_search_sync_programs
  after insert or update or delete on public.programs
  for each row execute function public.sync_search_index();

-- Backfill anything that already exists.
create or replace function public.rebuild_search_index()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer := 0;
begin
  delete from public.search_index;
  update public.series   set updated_at = updated_at;
  update public.movies   set updated_at = updated_at;
  update public.programs set updated_at = updated_at;
  select count(*) into n from public.search_index;
  return n;
end;
$$;

-- =============================================================================
-- 4. RLS — the index mirrors the visibility of its source rows
-- =============================================================================

alter table public.search_index enable row level security;

drop policy if exists "search_index_public_read" on public.search_index;
create policy "search_index_public_read"
  on public.search_index for select
  using (status = 'published' or public.is_staff());

-- Writes happen only through the SECURITY DEFINER trigger.
revoke insert, update, delete on public.search_index from anon, authenticated;
grant select on public.search_index to anon, authenticated;

-- =============================================================================
-- 5. SEARCH RPC
-- =============================================================================

create or replace function public.search_catalog(
  q            text,
  lang         text default 'ar',
  types        text[] default null,
  genre_filter text[] default null,
  year_from    smallint default null,
  year_to      smallint default null,
  max_results  integer default 20,
  skip         integer default 0
)
returns table (
  entity_type text,
  entity_id   uuid,
  slug        text,
  title       text,
  synopsis    text,
  poster_url  text,
  year        smallint,
  genres      text[],
  rank        real,
  match_kind  text
)
language plpgsql              -- NOT sql: plpgsql locals become bound parameters,
stable                        -- which the GIN indexes can be probed with.
security invoker              -- RLS applies: anonymous visitors never see drafts.
parallel safe
set search_path = public
-- Thresholds for the `%` and `%>` operators. These are what make the trigram
-- indexes usable, and they must agree with the scoring below.
-- 0.25 on similarity is deliberately loose: measured signal for real
-- cross-script matches runs 0.29-1.00 while unrelated titles score 0.00, and
-- the `rank > 0.12` filter at the end restores precision.
set pg_trgm.similarity_threshold = 0.25
set pg_trgm.word_similarity_threshold = 0.45
as $$
declare
  nq   text;
  sq   text;
  tsq  tsquery;
  lim  integer := greatest(least(max_results, 50), 1);
  off_ integer := greatest(skip, 0);
begin
  if nullif(trim(q), '') is null then
    return;
  end if;

  nq := public.normalize_search(q);

  -- The indexed skeleton has the Arabic article stripped, so strip the
  -- Latin/Arabic article the visitor typed too ("el 5aen" -> "5aen").
  sq := public.latin_skeleton(regexp_replace(nq, '^(el|al|il|le|la|les|the|ال)\s*', ''));

  -- Prefix-match every token so results appear while the visitor is still typing.
  tsq := to_tsquery('simple',
           array_to_string(
             array(
               select quote_literal(tok) || ':*'
               from unnest(string_to_array(nq, ' ')) as tok
               where length(tok) > 0
             ), ' & '));

  return query
  -- CANDIDATES as a UNION of single-predicate branches, not one OR chain.
  -- With an OR chain the planner mis-costs pg_trgm selectivity and falls back
  -- to a sequential scan (measured: 711 ms over 60k rows). Split this way each
  -- branch is costed on its own and every GIN index is used (measured: 6.6 ms).
  with candidates as (
    select si.entity_type as et, si.entity_id as eid from public.search_index si where si.tsv @@ tsq
    union
    select si.entity_type, si.entity_id from public.search_index si where si.title_norm %> nq
    union
    select si.entity_type, si.entity_id from public.search_index si where si.body_norm %> nq
    union
    select si.entity_type, si.entity_id from public.search_index si
      where length(sq) >= 2 and si.skeleton % sq
  ),
  scored as (
    select
      si.entity_type, si.entity_id, si.slug, si.title, si.synopsis,
      si.poster_url, si.year, si.genres,
      -- exact prefix > full-text > fuzzy title > cross-script skeleton
      (
        case when si.title_norm like nq || '%'        then 3.0 else 0 end
      + case when si.title_norm like '%' || nq || '%' then 1.2 else 0 end
      + ts_rank_cd(si.tsv, tsq) * 2.0
      + word_similarity(nq, si.title_norm) * 1.8
      + case
          when length(sq) >= 2 and si.skeleton like sq || '%'        then 1.4
          when length(sq) >= 4 and si.skeleton like '%' || sq || '%' then 1.0
          else similarity(si.skeleton, sq) * 0.8
        end
      )::real as rank,
      case
        when si.title_norm like nq || '%' then 'prefix'
        when si.tsv @@ tsq then 'fulltext'
        when word_similarity(nq, si.title_norm) > 0.45 then 'fuzzy'
        else 'translit'
      end as match_kind
    from candidates c
    join public.search_index si
      on si.entity_type = c.et and si.entity_id = c.eid
    where (types        is null or si.entity_type = any(types))
      and (genre_filter is null or si.genres && genre_filter)
      and (year_from    is null or si.year >= year_from)
      and (year_to      is null or si.year <= year_to)
  )
  select
    s.entity_type,
    s.entity_id,
    s.slug,
    coalesce(nullif(s.title ->> lang, ''), nullif(s.title ->> 'en', ''), nullif(s.title ->> 'ar', ''), '') as title,
    coalesce(nullif(s.synopsis ->> lang, ''), nullif(s.synopsis ->> 'en', ''), nullif(s.synopsis ->> 'ar', ''), '') as synopsis,
    s.poster_url,
    s.year,
    s.genres,
    s.rank,
    s.match_kind
  from scored s
  where s.rank > 0.12
  order by s.rank desc, s.year desc nulls last
  limit lim
  offset off_;
end;
$$;

grant execute on function public.search_catalog(text, text, text[], text[], smallint, smallint, integer, integer)
  to anon, authenticated;
grant execute on function public.normalize_search(text) to anon, authenticated;
grant execute on function public.latin_skeleton(text)   to anon, authenticated;

-- =============================================================================
-- 6. "Did you mean" suggestions — trigram nearest titles
-- =============================================================================

create or replace function public.search_suggest(q text, lang text default 'ar', max_results integer default 5)
returns table (suggestion text, sim real)
language sql
stable
security invoker
parallel safe
set search_path = public
as $$
  select
    coalesce(nullif(si.title ->> lang, ''), nullif(si.title ->> 'en', ''), si.title ->> 'ar') as suggestion,
    greatest(
      word_similarity(public.normalize_search(q), si.title_norm),
      similarity(si.skeleton, public.latin_skeleton(q))
    )::real as sim
  from public.search_index si
  where greatest(
          word_similarity(public.normalize_search(q), si.title_norm),
          similarity(si.skeleton, public.latin_skeleton(q))
        ) > 0.3
  order by sim desc
  limit greatest(least(max_results, 10), 1);
$$;

grant execute on function public.search_suggest(text, text, integer) to anon, authenticated;
