-- =============================================================================
-- 0013 — Editable hero copy, the brand mark, and the artwork for the 71 button.
--
-- Apply AFTER 0012.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. HERO COPY
--
--    The headline was three hardcoded lines in the component, which is an
--    English-shaped decision: Arabic sets shorter and wraps differently, and
--    the same fixed break points snapped the phrase in the wrong places.
--
--    It is now ONE string per language plus an optional fragment to paint in
--    the brand colour. The browser wraps it; the operator chooses the accent.
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists hero_enabled    boolean not null default true,
  add column if not exists hero_eyebrow    jsonb   not null default '{}'::jsonb,
  add column if not exists hero_headline   jsonb   not null default '{}'::jsonb,
  add column if not exists hero_highlight  jsonb   not null default '{}'::jsonb,
  add column if not exists hero_body       jsonb   not null default '{}'::jsonb,

  -- Brand assets. Null means "use the file bundled in /public/brand", so the
  -- site is never logo-less while an operator is mid-upload.
  add column if not exists logo_url        text,
  add column if not exists logo_dark_url   text,
  add column if not exists anniversary_art_url text,

  -- A phone should not download the desktop master. This is the optional
  -- lighter cut (720p, short, heavily compressed) served to narrow screens;
  -- null means "use the same file as desktop".
  add column if not exists backdrop_mobile_url text;

alter table public.site_settings
  drop constraint if exists site_settings_brand_urls;

alter table public.site_settings
  add constraint site_settings_brand_urls check (
    (logo_url            is null or logo_url            ~ '^https?://[^\s<>"'']+$') and
    (logo_dark_url       is null or logo_dark_url       ~ '^https?://[^\s<>"'']+$') and
    (anniversary_art_url is null or anniversary_art_url ~ '^https?://[^\s<>"'']+$') and
    (backdrop_mobile_url is null or backdrop_mobile_url ~ '^https?://[^\s<>"'']+$')
  );

-- Seed the copy that is currently hardcoded, so nothing changes visually until
-- the operator edits it. Only fills blanks — a second run will not overwrite
-- edited text.
update public.site_settings
set
  hero_eyebrow = case when hero_eyebrow = '{}'::jsonb then
    '{"en":"Established 1955 · Beirut · Cairo · Casablanca · Dubai",
      "ar":"تأسست عام ١٩٥٥ · بيروت · القاهرة · الدار البيضاء · دبي",
      "fr":"Fondée en 1955 · Beyrouth · Le Caire · Casablanca · Dubaï"}'::jsonb
    else hero_eyebrow end,

  hero_headline = case when hero_headline = '{}'::jsonb then
    '{"en":"Seven decades of Arabic storytelling.",
      "ar":"سبعة عقود من الحكاية العربية.",
      "fr":"Sept décennies de récits arabes."}'::jsonb
    else hero_headline end,

  hero_highlight = case when hero_highlight = '{}'::jsonb then
    '{"en":"Arabic storytelling","ar":"الحكاية العربية","fr":"récits arabes"}'::jsonb
    else hero_highlight end,

  hero_body = case when hero_body = '{}'::jsonb then
    '{"en":"From Beirut to the world — the drama library that shaped a region.",
      "ar":"من بيروت إلى العالم — المكتبة الدرامية التي صنعت ذاكرة المنطقة.",
      "fr":"De Beyrouth au monde — la bibliothèque dramatique qui a façonné une région."}'::jsonb
    else hero_body end
where id;

-- ---------------------------------------------------------------------------
-- 2. BRAND BUCKET — logos and the button artwork.
--    Public read (a logo is served to anonymous visitors by definition),
--    staff-only write.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand', 'brand', true, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists brand_public_read on storage.objects;
drop policy if exists brand_staff_write on storage.objects;
drop policy if exists brand_staff_update on storage.objects;
drop policy if exists brand_staff_delete on storage.objects;

create policy brand_public_read on storage.objects
  for select using (bucket_id = 'brand');

create policy brand_staff_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand' and public.is_staff());

create policy brand_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'brand' and public.is_staff());

create policy brand_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'brand' and public.is_super_admin());
