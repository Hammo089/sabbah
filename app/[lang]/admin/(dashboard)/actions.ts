// app/[lang]/admin/(dashboard)/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff, isSuperAdmin } from '@/lib/auth/rbac';

const FeaturedSchema = z.object({
  table: z.enum(['series', 'movies', 'programs']),
  id: z.string().uuid(),
  value: z.boolean(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Toggles `is_featured_slider`. Server-side role check + RLS = defence in depth.
 */
export async function toggleFeaturedSlider(
  input: z.infer<typeof FeaturedSchema>,
): Promise<ActionResult> {
  const parsed = FeaturedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const { table, id, value } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from(table)
    .update({ is_featured_slider: value })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------

const StatusSchema = z.object({
  table: z.enum(['series', 'movies', 'programs']),
  id: z.string().uuid(),
  status: z.enum(['draft', 'in_review', 'published', 'archived']),
});

export async function setContentStatus(
  input: z.infer<typeof StatusSchema>,
): Promise<ActionResult> {
  const parsed = StatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(parsed.data.table)
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

const RoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['super_admin', 'admin', 'editor', 'b2b_client', 'viewer']),
});

/**
 * Role changes are super_admin only, and a super_admin may not demote himself —
 * otherwise the last one can lock everybody out of the panel.
 */
export async function setUserRole(input: z.infer<typeof RoleSchema>): Promise<ActionResult> {
  const parsed = RoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  if (profile && profile.id === parsed.data.userId && parsed.data.role !== 'super_admin') {
    return { ok: false, error: 'CANNOT_DEMOTE_SELF' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('users_profiles')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

const ActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

/**
 * Deactivate or reactivate an account.
 *
 * `is_active` is what `hasRole` actually gates on (lib/auth/rbac.ts), so this
 * is the real revocation switch — without it, removing a departed staff
 * member's access meant demoting them by hand or editing the database.
 *
 * Deactivating yourself is refused for the same reason demoting yourself is:
 * the last super_admin can otherwise lock the whole organisation out.
 */
export async function setUserActive(input: z.infer<typeof ActiveSchema>): Promise<ActionResult> {
  const parsed = ActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  if (profile && profile.id === parsed.data.userId && !parsed.data.isActive) {
    return { ok: false, error: 'CANNOT_DEACTIVATE_SELF' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('users_profiles')
    .update({ is_active: parsed.data.isActive })
    .eq('id', parsed.data.userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}
