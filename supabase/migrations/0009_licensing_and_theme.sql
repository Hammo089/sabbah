-- =============================================================================
-- 1. LICENSING — a licence is a contract between a title and a company.
--    Adds the buyer as a real relation, the signing date, and expiry alerting.
-- =============================================================================

alter table public.drm_licenses
  add column if not exists licensee_id  uuid references public.broadcasters(id) on delete set null,
  add column if not exists signed_on    date,
  add column if not exists reminder_days smallint not null default 30,
  add column if not exists reminder_ack boolean not null default false,
  add column if not exists currency     char(3) not null default 'USD';

create index if not exists drm_licenses_ends_idx     on public.drm_licenses (ends_on);
create index if not exists drm_licenses_licensee_idx on public.drm_licenses (licensee_id);

-- A licence is "expiring" when today has reached (ends_on - reminder_days).
create or replace view public.expiring_licenses
with (security_invoker = true) as
select
  d.id,
  d.licensee_name,
  b.name             as licensee_company,
  d.status,
  d.starts_on,
  d.ends_on,
  d.reminder_days,
  d.reminder_ack,
  (d.ends_on - current_date)                       as days_left,
  (d.ends_on is not null and d.ends_on < current_date) as expired,
  s.slug             as series_slug,
  s.title            as series_title,
  m.slug             as movie_slug,
  m.title            as movie_title
from public.drm_licenses d
left join public.broadcasters b on b.id = d.licensee_id
left join public.series       s on s.id = d.series_id
left join public.movies       m on m.id = d.movie_id
where d.ends_on is not null
  and d.status in ('licensed', 'optioned')
  and current_date >= (d.ends_on - d.reminder_days);

grant select on public.expiring_licenses to authenticated;

-- Count for the dashboard badge. Gated on is_super_admin(), NOT is_staff():
-- drm_licenses is super_admin-only, so letting an editor see "2 contracts
-- expiring" would leak the existence of rows they cannot read.
create or replace function public.expiring_license_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_super_admin() then (
      select count(*)::int
      from public.drm_licenses d
      where d.ends_on is not null
        and d.status in ('licensed', 'optioned')
        and not d.reminder_ack
        and current_date >= (d.ends_on - d.reminder_days)
    )
    else 0
  end;
$$;

grant execute on function public.expiring_license_count() to authenticated;

-- =============================================================================
-- 2. THEME — appearance knobs staff control without a deploy.
-- =============================================================================

alter table public.site_settings
  add column if not exists theme_primary     text    not null default '#2c845c',
  add column if not exists theme_accent      text    not null default '#3aa877',
  add column if not exists theme_background  text    not null default '#000000',
  add column if not exists theme_foreground  text    not null default '#ffffff',
  add column if not exists theme_muted       text    not null default '#767676',
  add column if not exists theme_radius      text    not null default '0.375rem',
  add column if not exists header_style      text    not null default 'transparent'
    check (header_style in ('transparent', 'solid')),
  add column if not exists hero_align        text    not null default 'start'
    check (hero_align in ('start', 'center')),
  add column if not exists hero_show_strip   boolean not null default true,
  add column if not exists show_stats        boolean not null default true,
  add column if not exists show_marquee      boolean not null default true,
  add column if not exists show_showcase     boolean not null default true,
  add column if not exists show_rails        boolean not null default true,
  add column if not exists show_partners     boolean not null default true,
  add column if not exists cta_primary_href  text,
  add column if not exists section_order     text[]  not null
    default array['showcase','anniversary','rails','partners'];

-- Colours are injected as CSS variables, so reject anything that is not a
-- plain hex value — otherwise a stored string could break out of the style tag.
alter table public.site_settings
  drop constraint if exists site_settings_hex_colors;

alter table public.site_settings
  add constraint site_settings_hex_colors check (
    theme_primary    ~ '^#[0-9a-fA-F]{6}$' and
    theme_accent     ~ '^#[0-9a-fA-F]{6}$' and
    theme_background ~ '^#[0-9a-fA-F]{6}$' and
    theme_foreground ~ '^#[0-9a-fA-F]{6}$' and
    theme_muted      ~ '^#[0-9a-fA-F]{6}$'
  );
