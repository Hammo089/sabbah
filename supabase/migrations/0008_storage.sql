-- =============================================================================
-- Media storage: one bucket per asset kind, uploaded straight from the admin
-- panel by drag & drop. Uploads go browser -> Supabase Storage directly, so a
-- 20 MB poster never travels through a serverless function.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('posters',     'posters',     true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('backdrops',   'backdrops',   true, 15728640, array['image/jpeg','image/png','image/webp','image/avif']),
  ('people',      'people',      true,  5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('broadcasters','broadcasters',true,  2097152, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']),
  ('legacy',      'legacy',      true, 26214400, array['image/jpeg','image/png','image/webp','image/avif','video/mp4']),
  ('gallery',     'gallery',     true, 15728640, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Policies. Anyone may read (these are public marketing assets); only staff
-- may write, and the write policies are per-bucket so a compromised editor
-- session cannot reach the private `contracts` bucket.
-- ---------------------------------------------------------------------------

do $$
declare
  b text;
  public_buckets text[] := array['posters','backdrops','people','broadcasters','legacy','gallery'];
begin
  foreach b in array public_buckets loop
    execute format('drop policy if exists %I on storage.objects', b || '_read');
    execute format('drop policy if exists %I on storage.objects', b || '_write');
    execute format('drop policy if exists %I on storage.objects', b || '_update');
    execute format('drop policy if exists %I on storage.objects', b || '_delete');

    execute format(
      'create policy %I on storage.objects for select using (bucket_id = %L)',
      b || '_read', b);

    execute format(
      'create policy %I on storage.objects for insert with check (bucket_id = %L and public.is_staff())',
      b || '_write', b);

    execute format(
      'create policy %I on storage.objects for update using (bucket_id = %L and public.is_staff()) with check (bucket_id = %L and public.is_staff())',
      b || '_update', b, b);

    execute format(
      'create policy %I on storage.objects for delete using (bucket_id = %L and public.is_staff())',
      b || '_delete', b);
  end loop;
end $$;

-- The older catch-all policies from 0001 are now redundant and would grant
-- writes on buckets the per-bucket policies deliberately restrict.
drop policy if exists "public_media_read" on storage.objects;
drop policy if exists "staff_media_write" on storage.objects;
