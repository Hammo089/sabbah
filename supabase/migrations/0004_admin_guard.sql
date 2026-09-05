-- =============================================================================
-- Guard: never allow the last super_admin to be removed or demoted.
-- Without this, one careless role change locks every human out of the panel
-- and only a service-role SQL session can recover the project.
-- =============================================================================

create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  -- Only care when a super_admin stops being one (demoted, deactivated, deleted).
  if tg_op = 'UPDATE'
     and old.role = 'super_admin'
     and (new.role is distinct from 'super_admin' or new.is_active = false)
  then
    select count(*) into remaining
      from public.users_profiles
     where role = 'super_admin' and is_active and id <> old.id;

    if remaining = 0 then
      raise exception 'Refusing to remove the last active super_admin'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' and old.role = 'super_admin' then
    select count(*) into remaining
      from public.users_profiles
     where role = 'super_admin' and is_active and id <> old.id;

    if remaining = 0 then
      raise exception 'Refusing to delete the last active super_admin'
        using errcode = '23514';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_protect_last_super_admin on public.users_profiles;
create trigger trg_protect_last_super_admin
  before update or delete on public.users_profiles
  for each row execute function public.protect_last_super_admin();
