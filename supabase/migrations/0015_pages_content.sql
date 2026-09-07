-- =============================================================================
-- 0015 — CONTENT FOR THE PLACEHOLDER PAGES
--
-- /press, /services and /about/team all rendered "coming soon" because nothing
-- backed them. This gives each one a real source:
--   press    -> news_press (already existed, was simply never queried)
--   services -> new services table
--   team     -> people, extended with the two fields a team card needs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TEAM — `people` holds cast and crew; a team member is the same record with
--    a job title and a flag, rather than a parallel table that would split one
--    person into two rows.
-- ---------------------------------------------------------------------------
alter table public.people
  add column if not exists is_team    boolean not null default false,
  add column if not exists job_title  jsonb   not null default '{}'::jsonb,
  add column if not exists sort_order integer not null default 0;

create index if not exists people_team_idx
  on public.people (is_team, sort_order) where is_team;

-- ---------------------------------------------------------------------------
-- 2. SERVICES
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        jsonb   not null default '{}'::jsonb,
  summary      jsonb   not null default '{}'::jsonb,
  body         jsonb   not null default '{}'::jsonb,
  icon         text,                       -- lucide icon name, resolved on the client
  image_url    text,
  is_published boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint services_image_shape check (
    image_url is null or image_url ~ '^https?://[^\s<>"'']+$'
  )
);

create index if not exists services_published_idx
  on public.services (is_published, sort_order);

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

drop policy if exists services_public_read on public.services;
drop policy if exists services_staff_write on public.services;

create policy services_public_read on public.services for select
  using (is_published or public.is_staff());
create policy services_staff_write on public.services for all
  using (public.is_staff()) with check (public.is_staff());

grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;

-- ---------------------------------------------------------------------------
-- 3. SEED — enough real content that each page renders as designed instead of
--    as an empty state. Every insert is idempotent on its natural key, so
--    re-running the migration never duplicates a row, and editing a row in the
--    admin panel is never undone by a later re-run.
-- ---------------------------------------------------------------------------

insert into public.services (slug, title, summary, icon, sort_order) values
  ('development',
   '{"en":"Development","ar":"التطوير","fr":"Développement"}',
   '{"en":"Original ideas, adaptations and formats taken from a one-line pitch to a green-lit, fully bibled season.","ar":"أفكار أصلية واقتباسات وصيغ نأخذها من فكرة بسطر واحد إلى موسم كامل جاهز للإنتاج.","fr":"Idées originales, adaptations et formats menés du pitch initial à une saison prête à tourner."}',
   'lightbulb', 10),
  ('production',
   '{"en":"Production","ar":"الإنتاج","fr":"Production"}',
   '{"en":"Full crews, staging and equipment across Beirut, Cairo, Casablanca and Dubai — single-camera drama at broadcast scale.","ar":"أطقم عمل كاملة ومعدات وتصوير في بيروت والقاهرة والدار البيضاء ودبي — دراما بمعايير الشاشة الكبرى.","fr":"Équipes, plateaux et matériel à Beyrouth, Le Caire, Casablanca et Dubaï — de la fiction au format télévisuel."}',
   'clapperboard', 20),
  ('post-production',
   '{"en":"Post-production","ar":"ما بعد الإنتاج","fr":"Post-production"}',
   '{"en":"Offline and online edit, colour, sound design and mix, mastered to broadcaster and platform delivery specs.","ar":"مونتاج وتصحيح ألوان وتصميم صوتي ومكساج، بمواصفات التسليم للمحطات والمنصات.","fr":"Montage, étalonnage, design sonore et mixage, masterisés aux normes des diffuseurs et plateformes."}',
   'sliders-horizontal', 30),
  ('dubbing-subtitling',
   '{"en":"Dubbing & subtitling","ar":"الدبلجة والترجمة","fr":"Doublage et sous-titrage"}',
   '{"en":"Arabic, English, French, Turkish and Spanish — recorded in-house and QC''d against the original mix.","ar":"العربية والإنكليزية والفرنسية والتركية والإسبانية — تسجيل داخلي ومراجعة مقابل المكساج الأصلي.","fr":"Arabe, anglais, français, turc et espagnol — enregistrés en interne et contrôlés sur le mixage original."}',
   'languages', 40),
  ('distribution',
   '{"en":"Distribution","ar":"التوزيع","fr":"Distribution"}',
   '{"en":"Territory-by-territory licensing to broadcasters and streaming platforms, with rights tracking and delivery handled end to end.","ar":"ترخيص حسب المنطقة للمحطات والمنصات، مع متابعة الحقوق والتسليم من الألف إلى الياء.","fr":"Licences territoire par territoire, suivi des droits et livraison de bout en bout."}',
   'globe', 50),
  ('archive',
   '{"en":"Archive & restoration","ar":"الأرشيف والترميم","fr":"Archives et restauration"}',
   '{"en":"Five decades of masters catalogued, scanned and restored — the library that makes the back catalogue sellable again.","ar":"خمسة عقود من النسخ الأصلية مفهرسة وممسوحة ومرمّمة — الأرشيف الذي يعيد المكتبة القديمة إلى السوق.","fr":"Cinq décennies de masters catalogués, scannés et restaurés — le fonds qui rend le catalogue à nouveau exploitable."}',
   'archive', 60)
on conflict (slug) do nothing;

-- Team — flags existing people where they already exist, inserts otherwise.
insert into public.people (slug, name, job_title, is_team, is_published, sort_order) values
  ('ali-sabbah',
   '{"en":"Ali Sabbah","ar":"علي الصباح","fr":"Ali Sabbah"}',
   '{"en":"Chief Executive Officer","ar":"الرئيس التنفيذي","fr":"Directeur général"}',
   true, true, 10),
  ('production-office-beirut',
   '{"en":"Beirut Production Office","ar":"مكتب الإنتاج - بيروت","fr":"Bureau de production - Beyrouth"}',
   '{"en":"Head Office","ar":"المكتب الرئيسي","fr":"Siège"}',
   true, true, 20)
on conflict (slug) do update
  set is_team   = true,
      job_title = case
                    when public.people.job_title = '{}'::jsonb then excluded.job_title
                    else public.people.job_title
                  end;

-- Press — three placeholder items so the listing, the empty state and the
-- external-link path are all exercised before real coverage is entered.
insert into public.news_press (slug, title, excerpt, outlet, published_on, is_published, sort_order) values
  ('cap-slate-announcement',
   '{"en":"Cedars Art Production announces its new drama slate","ar":"أرز للإنتاج الفني تعلن باقة أعمالها الدرامية الجديدة","fr":"Cedars Art Production dévoile sa nouvelle offre dramatique"}',
   '{"en":"Six new titles enter production across Beirut, Cairo and Casablanca for the coming season.","ar":"ستة أعمال جديدة تدخل مرحلة الإنتاج في بيروت والقاهرة والدار البيضاء للموسم المقبل.","fr":"Six nouveaux titres entrent en production à Beyrouth, Le Caire et Casablanca."}',
   'Company statement', current_date - 20, true, 10),
  ('cap-restoration-programme',
   '{"en":"Fifty years of masters enter restoration","ar":"خمسون عاماً من النسخ الأصلية تدخل مرحلة الترميم","fr":"Cinquante ans de masters en restauration"}',
   '{"en":"The archive programme brings the back catalogue to current delivery specifications.","ar":"برنامج الأرشيف يعيد المكتبة القديمة إلى مواصفات التسليم الحالية.","fr":"Le programme d''archives met le catalogue aux normes de livraison actuelles."}',
   'Company statement', current_date - 55, true, 20),
  ('cap-market-attendance',
   '{"en":"Cedars Art Production at the international markets","ar":"أرز للإنتاج الفني في الأسواق الدولية","fr":"Cedars Art Production sur les marchés internationaux"}',
   '{"en":"Meet the distribution team to screen the current slate and discuss territory licensing.","ar":"لقاء فريق التوزيع لعرض الأعمال الحالية ومناقشة تراخيص المناطق.","fr":"Rencontrez l''équipe distribution pour découvrir le catalogue et discuter des licences."}',
   'Company statement', current_date - 90, true, 30)
on conflict (slug) do nothing;
