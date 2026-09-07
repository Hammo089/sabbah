// lib/auth/rbac.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type AppRole = Database['public']['Enums']['app_role'];
export type Profile = Database['public']['Tables']['users_profiles']['Row'];

export const STAFF_ROLES: readonly AppRole[] = ['super_admin', 'admin', 'editor'] as const;

/** Deduped per-request fetch of the authenticated user's profile. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('users_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data ?? null;
});

export function hasRole(profile: Profile | null, ...roles: AppRole[]): boolean {
  return !!profile && profile.is_active && roles.includes(profile.role);
}

export function isStaff(profile: Profile | null): boolean {
  return hasRole(profile, ...STAFF_ROLES);
}

export function isSuperAdmin(profile: Profile | null): boolean {
  return hasRole(profile, 'super_admin');
}

/**
 * Site-wide configuration — theme, hero copy, logos, section visibility,
 * company legacy. An editor curates content; changing what every visitor sees
 * on the homepage is an owner decision, which is why the sidebar and the
 * dashboard tiles already hide these. Pages must enforce it too: hiding a link
 * is not access control, and the routes are guessable.
 */
export function isAdmin(profile: Profile | null): boolean {
  return hasRole(profile, 'super_admin', 'admin');
}
