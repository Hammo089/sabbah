'use server';

// app/[lang]/admin/(dashboard)/season-actions.ts
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { GENRES, LANGUAGES, SUBTITLE_LANGUAGES } from '@/lib/admin/season-taxonomy';
import type { ActionResult } from './actions';

/** Only terms that exist in the vocabulary survive — the browser cannot invent one. */
function clean(values: FormDataEntryValue[], vocab: { value: string }[]): string[] {
  const allowed = new Set(vocab.map((v) => v.value));
  return [...new Set(values.map(String).filter((v) => allowed.has(v)))];
}

const DetailsSchema = z.object({
  id: z.string().uuid(),
  region: z.enum(['levant', 'egypt', 'arabia', 'maghreb', 'other']),
  production_country: z.string().max(2).nullable().or(z.literal('')).transform((v) => v || null),
  seas_code: z.string().max(20).nullable().or(z.literal('')).transform((v) => v || null),
  prog_code: z.string().max(20).nullable().or(z.literal('')).transform((v) => v || null),
  remarks: z.string().max(2000).nullable().or(z.literal('')).transform((v) => v || null),
});

export async function saveSeasonDetails(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = DetailsSchema.safeParse({
    id: formData.get('id'),
    region: formData.get('region'),
    production_country: String(formData.get('production_country') ?? '').trim().toUpperCase(),
    seas_code: String(formData.get('seas_code') ?? '').trim(),
    prog_code: String(formData.get('prog_code') ?? '').trim(),
    remarks: String(formData.get('remarks') ?? '').trim(),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'INVALID_INPUT' };
  }

  const payload = {
    ...parsed.data,
    genres: clean(formData.getAll('genres'), GENRES),
    audio_langs: clean(formData.getAll('audio_langs'), LANGUAGES),
    dubbing_langs: clean(formData.getAll('dubbing_langs'), LANGUAGES),
    subtitling_langs: clean(formData.getAll('subtitling_langs'), SUBTITLE_LANGUAGES),
  };

  const { id, ...values } = payload;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('series').update(values).eq('id', id);
  if (error) return { ok: false, error: error.message };

  await supabase.from('tracking_events').insert({
    entity: 'series',
    entity_id: id,
    action: 'update',
    summary: 'Season details',
    actor_id: profile?.id ?? null,
    actor_email: profile?.email ?? null,
  });

  revalidatePath('/[lang]/admin/series/[id]', 'page');
  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

const LinksSchema = z.object({
  id: z.string().uuid(),
  watch_url: z.string().url().max(600).nullable().or(z.literal('')).transform((v) => v || null),
  website_url: z.string().url().max(600).nullable().or(z.literal('')).transform((v) => v || null),
  press_kit_url: z.string().url().max(600).nullable().or(z.literal('')).transform((v) => v || null),
  youtube_id: z.string().max(32).regex(/^[A-Za-z0-9_-]*$/).nullable().or(z.literal('')).transform((v) => v || null),
});

export async function saveSeasonLinks(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = LinksSchema.safeParse({
    id: formData.get('id'),
    watch_url: String(formData.get('watch_url') ?? '').trim(),
    website_url: String(formData.get('website_url') ?? '').trim(),
    press_kit_url: String(formData.get('press_kit_url') ?? '').trim(),
    youtube_id: String(formData.get('youtube_id') ?? '').trim(),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'INVALID_INPUT' };
  }

  const { id, ...values } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('series').update(values).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin/series/[id]', 'page');
  return { ok: true };
}

/** Adds or removes one title from the homepage hero cluster. */
export async function setHeroPick(id: string, picked: boolean): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: 'INVALID_ID' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('series')
    .update({ is_featured_slider: picked })
    .eq('id', parsed.data);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}
