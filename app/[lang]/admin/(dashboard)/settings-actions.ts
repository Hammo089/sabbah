// app/[lang]/admin/(dashboard)/settings-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff, isSuperAdmin } from '@/lib/auth/rbac';
import type { ActionResult } from './actions';

const SettingsSchema = z.object({
  ticker_enabled: z.boolean(),
  anniversary_enabled: z.boolean(),
  anniversary_youtube: z.string().max(32),
  hero_backdrop_url: z.string().url().nullable().or(z.literal('')),
  stat_years: z.string().max(8),
  stat_productions: z.string().max(8),
  stat_offices: z.string().max(8),
  stat_partners: z.string().max(8),
});

export async function saveSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = SettingsSchema.safeParse({
    ticker_enabled: formData.get('ticker_enabled') === 'on',
    anniversary_enabled: formData.get('anniversary_enabled') === 'on',
    anniversary_youtube: String(formData.get('anniversary_youtube') ?? '').trim(),
    hero_backdrop_url: String(formData.get('hero_backdrop_url') ?? '').trim() || null,
    stat_years: String(formData.get('stat_years') ?? '70'),
    stat_productions: String(formData.get('stat_productions') ?? '200'),
    stat_offices: String(formData.get('stat_offices') ?? '5'),
    stat_partners: String(formData.get('stat_partners') ?? '30'),
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('site_settings')
    .update({ ...parsed.data, hero_backdrop_url: parsed.data.hero_backdrop_url || null })
    .eq('id', true);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// News ticker
// ---------------------------------------------------------------------------

const TickerSchema = z.object({
  id: z.string().uuid().optional(),
  message_ar: z.string().max(300),
  message_en: z.string().max(300),
  message_fr: z.string().max(300),
  link_url: z.string().url().nullable().or(z.literal('')),
  priority: z.coerce.number().int().min(0).max(100),
  is_active: z.boolean(),
});

export async function saveTicker(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = TickerSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    message_ar: String(formData.get('message_ar') ?? ''),
    message_en: String(formData.get('message_en') ?? ''),
    message_fr: String(formData.get('message_fr') ?? ''),
    link_url: String(formData.get('link_url') ?? '').trim() || null,
    priority: formData.get('priority') || 0,
    is_active: formData.get('is_active') === 'on',
  });

  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const { id, message_ar, message_en, message_fr, link_url, ...rest } = parsed.data;
  const payload = {
    ...rest,
    link_url: link_url || null,
    message: { ar: message_ar, en: message_en, fr: message_fr },
  };

  const supabase = await createSupabaseServerClient();
  const { error } = id
    ? await supabase.from('news_ticker').update(payload).eq('id', id)
    : await supabase.from('news_ticker').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

export async function deleteTicker(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('news_ticker').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Broadcasters
// ---------------------------------------------------------------------------

const BroadcasterSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  logo_url: z.string().url().nullable().or(z.literal('')),
  site_url: z.string().url().nullable().or(z.literal('')),
  sort_order: z.coerce.number().int(),
});

export async function saveBroadcaster(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = BroadcasterSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    slug: String(formData.get('slug') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim(),
    logo_url: String(formData.get('logo_url') ?? '').trim() || null,
    site_url: String(formData.get('site_url') ?? '').trim() || null,
    sort_order: formData.get('sort_order') || 0,
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' };

  const { id, ...values } = parsed.data;
  const payload = { ...values, logo_url: values.logo_url || null, site_url: values.site_url || null };

  const supabase = await createSupabaseServerClient();
  const { error } = id
    ? await supabase.from('broadcasters').update(payload).eq('id', id)
    : await supabase.from('broadcasters').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

export async function deleteBroadcaster(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('broadcasters').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

/** Attach or detach a broadcaster on one title. */
export async function toggleTitleBroadcaster(input: {
  seriesId: string;
  broadcasterId: string;
  attach: boolean;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();

  const { error } = input.attach
    ? await supabase
        .from('title_broadcasters')
        .insert({ series_id: input.seriesId, broadcaster_id: input.broadcasterId })
    : await supabase
        .from('title_broadcasters')
        .delete()
        .eq('series_id', input.seriesId)
        .eq('broadcaster_id', input.broadcasterId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Staff invitations
// ---------------------------------------------------------------------------

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['super_admin', 'admin', 'editor', 'b2b_client', 'viewer']),
});

export async function inviteUser(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = InviteSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    role: formData.get('role'),
  });

  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createSupabaseServerClient();

  // If the person already has an account, set the role directly.
  const { data: existing } = await supabase
    .from('users_profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('users_profiles')
      .update({ role: parsed.data.role })
      .eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/[lang]/admin', 'layout');
    return { ok: true };
  }

  const { error } = await supabase
    .from('user_invitations')
    .upsert({ email: parsed.data.email, role: parsed.data.role, invited_by: profile?.id ?? null });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

export async function cancelInvitation(email: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('user_invitations').delete().eq('email', email);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Company legacy milestones
// ---------------------------------------------------------------------------

const LegacySchema = z.object({
  id: z.string().uuid().optional(),
  title_ar: z.string().max(200),
  title_en: z.string().max(200),
  title_fr: z.string().max(200),
  description_ar: z.string().max(2000),
  description_en: z.string().max(2000),
  description_fr: z.string().max(2000),
  video_url: z.string().url().nullable().or(z.literal('')),
  poster_url: z.string().url().nullable().or(z.literal('')),
  year: z.coerce.number().int().min(1900).max(2100).nullable(),
  is_published: z.boolean(),
  sort_order: z.coerce.number().int(),
});

export async function saveLegacy(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = LegacySchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    title_ar: String(formData.get('title_ar') ?? ''),
    title_en: String(formData.get('title_en') ?? ''),
    title_fr: String(formData.get('title_fr') ?? ''),
    description_ar: String(formData.get('description_ar') ?? ''),
    description_en: String(formData.get('description_en') ?? ''),
    description_fr: String(formData.get('description_fr') ?? ''),
    video_url: String(formData.get('video_url') ?? '').trim() || null,
    poster_url: String(formData.get('poster_url') ?? '').trim() || null,
    year: String(formData.get('year') ?? '').trim() || null,
    is_published: formData.get('is_published') === 'on',
    sort_order: formData.get('sort_order') || 0,
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' };

  const { id, title_ar, title_en, title_fr, description_ar, description_en, description_fr, video_url, poster_url, ...rest } = parsed.data;

  const payload = {
    ...rest,
    video_url: video_url || null,
    poster_url: poster_url || null,
    title: { ar: title_ar, en: title_en, fr: title_fr },
    description: { ar: description_ar, en: description_en, fr: description_fr },
  };

  const supabase = await createSupabaseServerClient();
  const { error } = id
    ? await supabase.from('company_legacy').update(payload).eq('id', id)
    : await supabase.from('company_legacy').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

export async function deleteLegacy(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('company_legacy').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}
