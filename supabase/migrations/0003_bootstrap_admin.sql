-- =============================================================================
-- Bootstrap the first super_admin.
-- Run ONCE, after signing up through the site's /login page (or Supabase
-- Auth > Users > Add user).
--
-- Why this is a separate manual step: guard_role_change() blocks role edits by
-- anyone who is not already a super_admin. With zero super_admins nobody can
-- promote anybody, so the very first one has to be set from the SQL editor,
-- which runs with no end-user JWT and is therefore allowed through.
-- =============================================================================

-- 1. Replace the email, then run.
update public.users_profiles
   set role = 'super_admin',
       is_active = true
 where email = 'REPLACE_WITH_YOUR_EMAIL';

-- 2. Verify — must return exactly your account with role = super_admin.
select id, email, role, is_active
  from public.users_profiles
 order by created_at;
