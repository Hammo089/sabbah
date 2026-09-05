// app/[lang]/admin/(dashboard)/title-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import type { ActionResult } from './actions';

const Localized = z.object({ ar: z.string().default(''), en: z.string().default(''), fr: z.string().default('') });

const TitleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'lowercase, digits and hyphens only'),
  title: Localized,
  subtitle: Localized,
  synopsis: Localized,
  kind: z.enum(['series', 'show', 'movie', 'animation']),
  region: z.enum(['levant', 'egypt', 'arabia', 'maghreb', 'other']),
  status: z.enum(['draft', 'in_review', 'published', 'archived']),
  year: z.coerce.number().int().min(1900).max(2100).nullable(),
  seasons_count: z.coerce.number().int().min(0).max(100),
  episodes_count: z.coerce.number().int().min(0).max(2000),
  genres: z.array(z.string()),
  production_country: z.string().max(2).nullable(),
  original_language: z.string().max(2),
  subtitle_langs: z.array(z.string()),
  poster_url: z.string().url().nullable().or(z.literal('')),
  backdrop_url: z.string().url().nullable().or(z.literal('')),
  youtube_id: z.string().max(32).nullable().or(z.literal('')),
  is_featured_slider: z.boolean(),
  is_hit: z.boolean(),
  is_new: z.boolean(),
  is_coming_soon: z.boolean(),
  is_script: z.boolean(),
  sort_order: z.coerce.number().int(),
});

export type TitleInput = z.infer<typeof TitleSchema>;

function csv(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function nullable(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? '').trim();
  return s === '' ? null : s;
}

export async function saveTitle(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const raw = {
    id: (formData.get('id') as string) || undefined,
    slug: String(formData.get('slug') ?? '').trim(),
    title: { ar: String(formData.get('title_ar') ?? ''), en: String(formData.get('title_en') ?? ''), fr: String(formData.get('title_fr') ?? '') },
    subtitle: { ar: String(formData.get('subtitle_ar') ?? ''), en: String(formData.get('subtitle_en') ?? ''), fr: String(formData.get('subtitle_fr') ?? '') },
    synopsis: { ar: String(formData.get('synopsis_ar') ?? ''), en: String(formData.get('synopsis_en') ?? ''), fr: String(formData.get('synopsis_fr') ?? '') },
    kind: formData.get('kind'),
    region: formData.get('region'),
    status: formData.get('status'),
    year: nullable(formData.get('year')),
    seasons_count: formData.get('seasons_count') || 1,
    episodes_count: formData.get('episodes_count') || 0,
    genres: csv(formData.get('genres')),
    production_country: nullable(formData.get('production_country')),
    original_language: String(formData.get('original_language') ?? 'ar'),
    subtitle_langs: csv(formData.get('subtitle_langs')),
    poster_url: nullable(formData.get('poster_url')),
    backdrop_url: nullable(formData.get('backdrop_url')),
    youtube_id: nullable(formData.get('youtube_id')),
    is_featured_slider: formData.get('is_featured_slider') === 'on',
    is_hit: formData.get('is_hit') === 'on',
    is_new: formData.get('is_new') === 'on',
    is_coming_soon: formData.get('is_coming_soon') === 'on',
    is_script: formData.get('is_script') === 'on',
    sort_order: formData.get('sort_order') || 0,
  };

  const parsed = TitleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  }

  const { id, ...values } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const payload = {
    ...values,
    poster_url: values.poster_url || null,
    backdrop_url: values.backdrop_url || null,
    youtube_id: values.youtube_id || null,
  };

  const { data, error } = id
    ? await supabase.from('series').update(payload).eq('id', id).select('id').single()
    : await supabase.from('series').insert(payload).select('id').single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');

  if (!id && data) redirect(`./${data.id}`);
  return { ok: true };
}

const DeleteSchema = z.object({ id: z.string().uuid() });

export async function deleteTitle(input: z.infer<typeof DeleteSchema>): Promise<ActionResult> {
  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  // Deleting a title destroys its episodes and credits by cascade — admins only.
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('series').delete().eq('id', parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const PersonSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  name: Localized,
  bio: Localized,
  photo_url: z.string().url().nullable().or(z.literal('')),
  birth_year: z.coerce.number().int().min(1850).max(2100).nullable(),
  nationality: z.string().max(2).nullable(),
  is_published: z.boolean(),
});

export async function savePerson(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = PersonSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    slug: String(formData.get('slug') ?? '').trim(),
    name: { ar: String(formData.get('name_ar') ?? ''), en: String(formData.get('name_en') ?? ''), fr: String(formData.get('name_fr') ?? '') },
    bio: { ar: String(formData.get('bio_ar') ?? ''), en: String(formData.get('bio_en') ?? ''), fr: String(formData.get('bio_fr') ?? '') },
    photo_url: nullable(formData.get('photo_url')),
    birth_year: nullable(formData.get('birth_year')),
    nationality: nullable(formData.get('nationality')),
    is_published: formData.get('is_published') === 'on',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  }

  const { id, ...values } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = { ...values, photo_url: values.photo_url || null };

  const { data, error } = id
    ? await supabase.from('people').update(payload).eq('id', id).select('id').single()
    : await supabase.from('people').insert(payload).select('id').single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  if (!id && data) redirect(`./${data.id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

const CreditSchema = z.object({
  seriesId: z.string().uuid(),
  personId: z.string().uuid(),
  kind: z.enum(['cast', 'crew']),
  role: z.string().max(80).optional(),
  characterAr: z.string().max(120).optional(),
  characterEn: z.string().max(120).optional(),
});

export async function addCredit(input: z.infer<typeof CreditSchema>): Promise<ActionResult> {
  const parsed = CreditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('credits').insert({
    series_id: parsed.data.seriesId,
    person_id: parsed.data.personId,
    kind: parsed.data.kind,
    role: parsed.data.role || null,
    character: { ar: parsed.data.characterAr ?? '', en: parsed.data.characterEn ?? '' },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

export async function removeCredit(creditId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(creditId).success) return { ok: false, error: 'INVALID_INPUT' };

  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('credits').delete().eq('id', creditId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}
