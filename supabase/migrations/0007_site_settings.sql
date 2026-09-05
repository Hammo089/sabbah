-- =============================================================================
-- Site settings: one editable row of switches and copy that staff control from
-- the panel instead of asking a developer for a deploy.
-- =============================================================================

create table if not exists public.site_settings (
  id                  boolean primary key default true check (id),
  ticker_enabled      boolean not null default true,
  anniversary_enabled boolean not null default true,
  anniversary_youtube text    not null default 'R0J7ypYwiDI',
  hero_backdrop_url   text,
  stat_years          text not null default '70',
  stat_productions    text not null default '200',
  stat_offices        text not null default '5',
  stat_partners       text not null default '30',
  updated_at          timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists site_settings_public_read on public.site_settings;
drop policy if exists site_settings_staff_write on public.site_settings;

create policy site_settings_public_read on public.site_settings for select using (true);
create policy site_settings_staff_write on public.site_settings for update
  using (public.is_staff()) with check (public.is_staff());

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

-- =============================================================================
-- Staff invitations — a super_admin pre-assigns a role to an email address.
-- When that person signs up, handle_new_user() picks the role up automatically.
-- Supabase's admin API cannot be called from the browser, so this is the safe
-- way to "add a user with permissions" without shipping the service-role key.
-- =============================================================================

create table if not exists public.user_invitations (
  email      text primary key,
  role       public.app_role not null default 'editor',
  invited_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.user_invitations enable row level security;

drop policy if exists invitations_super_admin on public.user_invitations;
create policy invitations_super_admin on public.user_invitations for all
  using (public.is_super_admin()) with check (public.is_super_admin());

grant select, insert, update, delete on public.user_invitations to authenticated;

-- Apply a pending invitation at signup time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited public.app_role;
begin
  select role into invited
    from public.user_invitations
   where lower(email) = lower(new.email)
     and accepted_at is null;

  insert into public.users_profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(invited, 'viewer')
  )
  on conflict (id) do nothing;

  if invited is not null then
    update public.user_invitations
       set accepted_at = now()
     where lower(email) = lower(new.email);
  end if;

  return new;
end;
$$;
