-- =============================================================================
-- 0012 — The 71st-anniversary film as the site backdrop, the glass surface
-- system that sits on top of it, and a public bucket to hold the video.
--
-- Apply AFTER 0011.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. BACKDROP + GLASS SETTINGS
--
--    Deliberately THREE separate media fields, not one:
--
--      backdrop_loop_url   a short silent loop, served to every visitor on
--                          every page — this is the one that costs bandwidth,
--                          so it must stay small.
--      backdrop_poster_url a still frame. Shown on phones, on reduced-motion,
--                          on Save-Data, and always as the video's poster so
--                          there is never a black rectangle while it loads.
--      anniversary_url     the full film with sound, fetched only when someone
--                          actually presses the 71 button.
--
--    Pointing all three at one large file is what makes a video-backdrop site
--    unusable on mobile data; the schema separates them so that cannot happen
--    by accident.
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists backdrop_enabled     boolean not null default false,
  add column if not exists backdrop_loop_url    text,
  add column if not exists backdrop_webm_url    text,
  add column if not exists backdrop_poster_url  text,
  add column if not exists backdrop_scope       text not null default 'all'
    check (backdrop_scope in ('home', 'all')),
  add column if not exists backdrop_brightness  smallint not null default 45
    check (backdrop_brightness between 10 and 100),
  add column if not exists backdrop_blur        smallint not null default 0
    check (backdrop_blur between 0 and 20),
  add column if not exists backdrop_on_mobile   boolean not null default false,

  -- The full film behind the 71 button. A YouTube id is accepted as a
  -- fallback for operators who would rather not pay to serve a large file.
  add column if not exists anniversary_url      text,
  add column if not exists anniversary_label    text not null default '71',
  add column if not exists anniversary_cta      boolean not null default true,

  -- Glass surfaces
  add column if not exists glass_enabled        boolean not null default false,
  add column if not exists glass_blur           smallint not null default 18
    check (glass_blur between 0 and 40),
  add column if not exists glass_opacity        smallint not null default 6
    check (glass_opacity between 0 and 40),
  add column if not exists glass_border         smallint not null default 14
    check (glass_border between 0 and 60);

-- URLs land in HTML attributes and CSS, so reject anything that is not a
-- plain http(s) URL at the database layer as well as in the action.
alter table public.site_settings
  drop constraint if exists site_settings_backdrop_urls;

alter table public.site_settings
  add constraint site_settings_backdrop_urls check (
    (backdrop_loop_url   is null or backdrop_loop_url   ~ '^https?://[^\s<>"'']+$') and
    (backdrop_webm_url   is null or backdrop_webm_url   ~ '^https?://[^\s<>"'']+$') and
    (backdrop_poster_url is null or backdrop_poster_url ~ '^https?://[^\s<>"'']+$') and
    (anniversary_url     is null or anniversary_url     ~ '^https?://[^\s<>"'']+$')
  );

-- ---------------------------------------------------------------------------
-- 2. PUBLIC VIDEO BUCKET
--    Public read: a background film is served to anonymous visitors by
--    definition, so a signed URL would buy nothing and break caching.
--    Writing stays staff-only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video', 'video', true, 524288000,
  array['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists video_public_read on storage.objects;
drop policy if exists video_staff_write on storage.objects;
drop policy if exists video_staff_update on storage.objects;
drop policy if exists video_staff_delete on storage.objects;

create policy video_public_read on storage.objects
  for select using (bucket_id = 'video');

create policy video_staff_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'video' and public.is_staff());

create policy video_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'video' and public.is_staff());

create policy video_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'video' and public.is_super_admin());
