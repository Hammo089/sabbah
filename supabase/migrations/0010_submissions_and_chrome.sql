-- =============================================================================
-- 0010 — Script submissions (private), site chrome (ticker speed, transition
-- loader, ambient background film) and the knowledge base that grounds the
-- public AI assistant.
--
-- Apply AFTER 0009.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SCRIPT SUBMISSIONS
--    Anyone may INSERT (that is the whole point of a public submission form).
--    Nobody may SELECT except staff. The writer cannot read back their own row,
--    so a submission can never be enumerated from the browser.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.submission_status as enum
    ('new', 'reviewing', 'shortlisted', 'rejected', 'optioned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_kind as enum
    ('series', 'film', 'format', 'novel', 'idea', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.script_submissions (
  id                uuid primary key default gen_random_uuid(),
  ref               text unique not null default (
                      'CAP-' || to_char(now(), 'YY') || '-' ||
                      upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6))
                    ),

  -- applicant
  full_name         text not null check (length(btrim(full_name)) between 2 and 120),
  email             text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text check (phone is null or length(phone) <= 40),
  country           text check (country is null or length(country) <= 80),
  agent_or_company  text check (agent_or_company is null or length(agent_or_company) <= 160),
  portfolio_url     text check (portfolio_url is null or portfolio_url ~* '^https?://'),

  -- the work
  work_title        text not null check (length(btrim(work_title)) between 2 and 200),
  kind              public.submission_kind not null default 'series',
  language          text not null default 'ar' check (language in ('ar','en','fr','other')),
  episodes_planned  smallint check (episodes_planned is null or episodes_planned between 0 and 500),
  logline           text not null check (length(btrim(logline)) between 10 and 600),
  synopsis          text check (synopsis is null or length(synopsis) <= 20000),

  -- the file, in a PRIVATE bucket — the path alone grants nothing
  file_path         text,
  file_name         text,
  file_size         integer,
  file_mime         text,

  -- AI pass
  ai_summary        text,
  ai_themes         text[],
  ai_genre          text,
  ai_comparables    text,
  ai_audience       text,
  ai_strength       text,
  ai_risk           text,
  ai_score          smallint check (ai_score is null or ai_score between 0 and 100),
  ai_model          text,
  ai_processed_at   timestamptz,
  ai_error          text,

  -- workflow
  status            public.submission_status not null default 'new',
  staff_notes       text,
  reviewed_by       uuid references public.users_profiles(id) on delete set null,

  consent_terms     boolean not null default false check (consent_terms),
  source_ip_hash    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists script_submissions_status_idx  on public.script_submissions (status, created_at desc);
create index if not exists script_submissions_created_idx on public.script_submissions (created_at desc);

drop trigger if exists trg_script_submissions_updated on public.script_submissions;
create trigger trg_script_submissions_updated
  before update on public.script_submissions
  for each row execute function public.set_updated_at();

alter table public.script_submissions enable row level security;

drop policy if exists submissions_public_insert on public.script_submissions;
drop policy if exists submissions_staff_read    on public.script_submissions;
drop policy if exists submissions_staff_write   on public.script_submissions;

-- Public may write, and only write.
create policy submissions_public_insert on public.script_submissions
  for insert to anon, authenticated with check (true);

-- Reading is staff-only. No "own row" escape hatch on purpose.
create policy submissions_staff_read on public.script_submissions
  for select using (public.is_staff());

create policy submissions_staff_write on public.script_submissions
  for update using (public.is_staff()) with check (public.is_staff());

grant insert on public.script_submissions to anon, authenticated;
grant select, update on public.script_submissions to authenticated;

-- ---------------------------------------------------------------------------
-- 2. PRIVATE STORAGE BUCKET for the uploaded scripts
--    public = false, so every read needs a signed URL minted server-side by a
--    staff session. Anonymous upload is allowed; anonymous read is not.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions', 'submissions', false, 26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'text/rtf'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists submissions_upload      on storage.objects;
drop policy if exists submissions_staff_read  on storage.objects;
drop policy if exists submissions_staff_purge on storage.objects;

create policy submissions_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'submissions');

create policy submissions_staff_read on storage.objects
  for select to authenticated
  using (bucket_id = 'submissions' and public.is_staff());

create policy submissions_staff_purge on storage.objects
  for delete to authenticated
  using (bucket_id = 'submissions' and public.is_super_admin());

-- ---------------------------------------------------------------------------
-- 3. SITE CHROME — ticker speed, transition loader, ambient background film
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists ticker_speed      smallint not null default 38
    check (ticker_speed between 10 and 240),
  add column if not exists loader_enabled    boolean  not null default true,
  add column if not exists loader_logo_url   text,
  add column if not exists loader_style      text     not null default 'ring'
    check (loader_style in ('ring', 'sweep', 'pulse', 'none')),
  add column if not exists loader_speed      smallint not null default 1400
    check (loader_speed between 400 and 6000),
  add column if not exists bg_video_enabled  boolean  not null default false,
  add column if not exists bg_video_youtube  text     not null default 'R0J7ypYwiDI',
  add column if not exists bg_video_opacity  smallint not null default 18
    check (bg_video_opacity between 0 and 60),
  add column if not exists bg_video_scope    text     not null default 'home'
    check (bg_video_scope in ('home', 'all')),
  add column if not exists submissions_open  boolean  not null default true,
  add column if not exists assistant_enabled boolean  not null default true;

-- ---------------------------------------------------------------------------
-- 4. ASSISTANT KNOWLEDGE — short Q/A and facts the public chat answers from.
--    Staff-editable, publicly readable: nothing here is confidential.
-- ---------------------------------------------------------------------------
create table if not exists public.assistant_knowledge (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null,
  question    jsonb not null default '{}'::jsonb,
  answer      jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_assistant_knowledge_updated on public.assistant_knowledge;
create trigger trg_assistant_knowledge_updated
  before update on public.assistant_knowledge
  for each row execute function public.set_updated_at();

alter table public.assistant_knowledge enable row level security;

drop policy if exists knowledge_public_read on public.assistant_knowledge;
drop policy if exists knowledge_staff_write on public.assistant_knowledge;

create policy knowledge_public_read on public.assistant_knowledge
  for select using (is_active or public.is_staff());
create policy knowledge_staff_write on public.assistant_knowledge
  for all using (public.is_staff()) with check (public.is_staff());

grant select on public.assistant_knowledge to anon, authenticated;
grant insert, update, delete on public.assistant_knowledge to authenticated;

insert into public.assistant_knowledge (topic, question, answer, sort_order)
select * from (values
  ('submissions',
   '{"en":"What kind of material do you accept?","ar":"شو نوع الأعمال اللي بتقبلوها؟","fr":"Quel type de projets acceptez-vous ?"}'::jsonb,
   '{"en":"Original drama series, feature films, formats, and novels or treatments with adaptation potential. Arabic-language work is our core, but we read English and French submissions too.","ar":"مسلسلات درامية أصلية، أفلام، فورمات، وروايات أو معالجات قابلة للاقتباس. شغلنا الأساسي بالعربي، بس منقرأ كمان الأعمال بالإنكليزي والفرنسي.","fr":"Séries dramatiques originales, longs métrages, formats, romans et traitements adaptables. L''arabe est notre cœur de métier, mais nous lisons aussi l''anglais et le français."}'::jsonb,
   1),
  ('submissions',
   '{"en":"How long until I hear back?","ar":"قدّيش بياخد وقت الردّ؟","fr":"Quel est le délai de réponse ?"}'::jsonb,
   '{"en":"Every submission is logged with a reference number the moment you send it. Our readers go through the queue continuously; expect a first response within four to six weeks.","ar":"كل تقديم بياخد رقم مرجعي أول ما تبعتو. فريق القراءة بيمشي بالطلبات باستمرار، والردّ الأول بيوصل خلال أربع لست أسابيع.","fr":"Chaque envoi reçoit un numéro de référence immédiatement. Nos lecteurs traitent la file en continu ; comptez quatre à six semaines pour une première réponse."}'::jsonb,
   2),
  ('submissions',
   '{"en":"Is my script kept confidential?","ar":"هل النص بيضل سرّي؟","fr":"Mon scénario reste-t-il confidentiel ?"}'::jsonb,
   '{"en":"Yes. Uploads go straight into a private store that only our team can open, and the file is never listed publicly anywhere on this site.","ar":"أكيد. الملف بينرفع ع مخزن خاص ما بيفوت عليه غير فريقنا، وما بيظهر بأي مكان عام بالموقع.","fr":"Oui. Les fichiers sont déposés dans un espace privé accessible uniquement à notre équipe et ne sont jamais listés publiquement."}'::jsonb,
   3),
  ('company',
   '{"en":"Who are you?","ar":"مين انتو؟","fr":"Qui êtes-vous ?"}'::jsonb,
   '{"en":"Cedars Art Production — Sabbah Brothers. A Beirut-based production and distribution house working in Arabic drama, film and formats since the 1950s, with offices in Cairo, Casablanca and Dubai.","ar":"سيدرز آرت برودكشن — الأخوين صباح. شركة إنتاج وتوزيع مقرّها بيروت، بتشتغل بالدراما والسينما والفورمات العربية من الخمسينات، وإلها مكاتب بالقاهرة والدار البيضاء ودبي.","fr":"Cedars Art Production — Sabbah Brothers. Maison de production et de distribution basée à Beyrouth, active dans la fiction, le cinéma et les formats arabes depuis les années 1950, avec des bureaux au Caire, à Casablanca et à Dubaï."}'::jsonb,
   4)
) as seed(topic, question, answer, sort_order)
where not exists (select 1 from public.assistant_knowledge);

-- ---------------------------------------------------------------------------
-- 5. Staff dashboard counter for unread submissions.
-- ---------------------------------------------------------------------------
create or replace function public.new_submission_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_staff() then
      (select count(*)::int from public.script_submissions where status = 'new')
    else 0
  end;
$$;

grant execute on function public.new_submission_count() to authenticated;
