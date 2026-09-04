// app/[lang]/admin/(dashboard)/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';

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
