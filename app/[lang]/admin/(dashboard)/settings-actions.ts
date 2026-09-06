// app/[lang]/admin/(dashboard)/settings-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff, isSuperAdmin } from '@/lib/auth/rbac';
import type { ActionResult } from './actions';

/** Ticker visibility + speed, editable straight from the ticker page. */
const TickerChromeSchema = z.object({
  ticker_enabled: z.boolean(),
  ticker_speed: z.coerce.number().int().min(10).max(240),
});

export async function saveTickerChrome(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = TickerChromeSchema.safeParse({
    ticker_enabled: formData.get('ticker_enabled') === 'on',
    ticker_speed: formData.get('ticker_speed') ?? 38,
  });

  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('site_settings').update(parsed.data).eq('id', true);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}

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

// ---------------------------------------------------------------------------
// Licensing contracts
// ---------------------------------------------------------------------------

const LicenceSchema = z.object({
  id: z.string().uuid().optional(),
  seriesId: z.string().uuid().nullable(),
  licenseeId: z.string().uuid().nullable(),
  licenseeName: z.string().min(1).max(160),
  territory: z.array(z.string()),
  rights: z.array(z.string()),
  drm: z.enum(['widevine', 'fairplay', 'playready', 'none']),
  status: z.enum(['available', 'optioned', 'licensed', 'expired', 'withdrawn']),
  exclusivity: z.boolean(),
  signedOn: z.string().nullable(),
  startsOn: z.string().nullable(),
  endsOn: z.string().nullable(),
  reminderDays: z.coerce.number().int().min(0).max(365),
  feeUsd: z.coerce.number().nonnegative().nullable(),
  currency: z.string().length(3),
  contractRef: z.string().max(120).nullable(),
  notes: z.string().max(2000).nullable(),
});

function csvList(v: FormDataEntryValue | null): string[] {
  return String(v ?? '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
}

function nullOr(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

/** Licences carry fees and contract references — super_admin only. */
export async function saveLicence(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = LicenceSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    seriesId: nullOr(formData.get('series_id')),
    licenseeId: nullOr(formData.get('licensee_id')),
    licenseeName: String(formData.get('licensee_name') ?? '').trim(),
    territory: csvList(formData.get('territory')),
    rights: csvList(formData.get('rights')),
    drm: formData.get('drm'),
    status: formData.get('status'),
    exclusivity: formData.get('exclusivity') === 'on',
    signedOn: nullOr(formData.get('signed_on')),
    startsOn: nullOr(formData.get('starts_on')),
    endsOn: nullOr(formData.get('ends_on')),
    reminderDays: formData.get('reminder_days') || 30,
    feeUsd: nullOr(formData.get('fee_usd')),
    currency: String(formData.get('currency') ?? 'USD').toUpperCase(),
    contractRef: nullOr(formData.get('contract_ref')),
    notes: nullOr(formData.get('notes')),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  }

  const d = parsed.data;

  if (d.startsOn && d.endsOn && d.endsOn < d.startsOn) {
    return { ok: false, error: 'END_BEFORE_START' };
  }
  if (!d.seriesId) return { ok: false, error: 'TITLE_REQUIRED' };

  const payload = {
    series_id: d.seriesId,
    movie_id: null,
    licensee_id: d.licenseeId,
    licensee_name: d.licenseeName,
    territory: d.territory,
    rights: d.rights,
    drm: d.drm,
    status: d.status,
    exclusivity: d.exclusivity,
    signed_on: d.signedOn,
    starts_on: d.startsOn,
    ends_on: d.endsOn,
    reminder_days: d.reminderDays,
    reminder_ack: false,
    fee_usd: d.feeUsd,
    currency: d.currency,
    contract_ref: d.contractRef,
    notes: d.notes,
  };

  const supabase = await createSupabaseServerClient();
  const { error } = d.id
    ? await supabase.from('drm_licenses').update(payload).eq('id', d.id)
    : await supabase.from('drm_licenses').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

export async function deleteLicence(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('drm_licenses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

/** Dismiss one expiry reminder until the contract is renewed. */
export async function acknowledgeReminder(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('drm_licenses').update({ reminder_ack: true }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

const HEX = /^#[0-9a-fA-F]{6}$/;

const ThemeSchema = z.object({
  theme_primary: z.string().regex(HEX),
  theme_accent: z.string().regex(HEX),
  theme_background: z.string().regex(HEX),
  theme_foreground: z.string().regex(HEX),
  theme_muted: z.string().regex(HEX),
  theme_radius: z.string().max(12),
  header_style: z.enum(['transparent', 'solid']),
  hero_align: z.enum(['start', 'center']),
  hero_show_strip: z.boolean(),
  show_stats: z.boolean(),
  show_marquee: z.boolean(),
  show_showcase: z.boolean(),
  show_rails: z.boolean(),
  show_partners: z.boolean(),
  ticker_speed: z.coerce.number().int().min(10).max(240),
  loader_enabled: z.boolean(),
  loader_style: z.enum(['ring', 'sweep', 'pulse', 'none']),
  loader_speed: z.coerce.number().int().min(400).max(6000),
  loader_logo_url: z.string().url().nullable().or(z.literal('')),
  bg_video_enabled: z.boolean(),
  bg_video_youtube: z.string().trim().max(32).regex(/^[A-Za-z0-9_-]*$/, 'INVALID_YOUTUBE_ID'),
  bg_video_opacity: z.coerce.number().int().min(0).max(60),
  bg_video_scope: z.enum(['home', 'all']),
  submissions_open: z.boolean(),
  assistant_enabled: z.boolean(),
  backdrop_enabled: z.boolean(),
  backdrop_loop_url: z.string().url().max(600).nullable().or(z.literal('')),
  backdrop_webm_url: z.string().url().max(600).nullable().or(z.literal('')),
  backdrop_poster_url: z.string().url().max(600).nullable().or(z.literal('')),
  backdrop_scope: z.enum(['home', 'all']),
  backdrop_brightness: z.coerce.number().int().min(10).max(100),
  backdrop_blur: z.coerce.number().int().min(0).max(20),
  backdrop_on_mobile: z.boolean(),
  anniversary_url: z.string().url().max(600).nullable().or(z.literal('')),
  anniversary_label: z.string().trim().max(8),
  anniversary_cta: z.boolean(),
  glass_enabled: z.boolean(),
  glass_blur: z.coerce.number().int().min(0).max(40),
  glass_opacity: z.coerce.number().int().min(0).max(40),
  glass_border: z.coerce.number().int().min(0).max(60),
});

export async function saveTheme(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = ThemeSchema.safeParse({
    theme_primary: formData.get('theme_primary'),
    theme_accent: formData.get('theme_accent'),
    theme_background: formData.get('theme_background'),
    theme_foreground: formData.get('theme_foreground'),
    theme_muted: formData.get('theme_muted'),
    theme_radius: formData.get('theme_radius'),
    header_style: formData.get('header_style'),
    hero_align: formData.get('hero_align'),
    hero_show_strip: formData.get('hero_show_strip') === 'on',
    show_stats: formData.get('show_stats') === 'on',
    show_marquee: formData.get('show_marquee') === 'on',
    show_showcase: formData.get('show_showcase') === 'on',
    show_rails: formData.get('show_rails') === 'on',
    show_partners: formData.get('show_partners') === 'on',
    ticker_speed: formData.get('ticker_speed') ?? 38,
    loader_enabled: formData.get('loader_enabled') === 'on',
    loader_style: formData.get('loader_style') ?? 'ring',
    loader_speed: formData.get('loader_speed') ?? 1400,
    loader_logo_url: String(formData.get('loader_logo_url') ?? '').trim() || null,
    bg_video_enabled: formData.get('bg_video_enabled') === 'on',
    bg_video_youtube: String(formData.get('bg_video_youtube') ?? '').trim(),
    bg_video_opacity: formData.get('bg_video_opacity') ?? 18,
    bg_video_scope: formData.get('bg_video_scope') ?? 'home',
    submissions_open: formData.get('submissions_open') === 'on',
    assistant_enabled: formData.get('assistant_enabled') === 'on',
    backdrop_enabled: formData.get('backdrop_enabled') === 'on',
    backdrop_loop_url: String(formData.get('backdrop_loop_url') ?? '').trim(),
    backdrop_webm_url: String(formData.get('backdrop_webm_url') ?? '').trim(),
    backdrop_poster_url: String(formData.get('backdrop_poster_url') ?? '').trim(),
    backdrop_scope: formData.get('backdrop_scope') ?? 'all',
    backdrop_brightness: formData.get('backdrop_brightness') ?? 45,
    backdrop_blur: formData.get('backdrop_blur') ?? 0,
    backdrop_on_mobile: formData.get('backdrop_on_mobile') === 'on',
    anniversary_url: String(formData.get('anniversary_url') ?? '').trim(),
    anniversary_label: String(formData.get('anniversary_label') ?? '71').trim(),
    anniversary_cta: formData.get('anniversary_cta') === 'on',
    glass_enabled: formData.get('glass_enabled') === 'on',
    glass_blur: formData.get('glass_blur') ?? 18,
    glass_opacity: formData.get('glass_opacity') ?? 6,
    glass_border: formData.get('glass_border') ?? 14,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'INVALID_APPEARANCE' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('site_settings')
    .update({
      ...parsed.data,
      loader_logo_url: parsed.data.loader_logo_url || null,
      backdrop_loop_url: parsed.data.backdrop_loop_url || null,
      backdrop_webm_url: parsed.data.backdrop_webm_url || null,
      backdrop_poster_url: parsed.data.backdrop_poster_url || null,
      anniversary_url: parsed.data.anniversary_url || null,
    })
    .eq('id', true);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]', 'layout');
  return { ok: true };
}


// ---------------------------------------------------------------------------
// Script submissions — staff only. Reading a submitted file goes through a
// short-lived signed URL so the private bucket is never made public.
// ---------------------------------------------------------------------------

const SubmissionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'reviewing', 'shortlisted', 'rejected', 'optioned']),
  staff_notes: z.string().max(4000).nullable(),
});

export async function updateSubmission(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = SubmissionSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    staff_notes: String(formData.get('staff_notes') ?? '').trim() || null,
  });

  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('script_submissions')
    .update({
      status: parsed.data.status,
      staff_notes: parsed.data.staff_notes,
      reviewed_by: profile?.id ?? null,
    })
    .eq('id', parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin/submissions', 'page');
  return { ok: true };
}

export async function getSubmissionFileUrl(
  id: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const supabase = await createSupabaseServerClient();

  const { data: row } = await supabase
    .from('script_submissions')
    .select('file_path')
    .eq('id', id)
    .maybeSingle();

  if (!row?.file_path) return { ok: false, error: 'NO_FILE' };

  const { data, error } = await supabase.storage
    .from('submissions')
    .createSignedUrl(row.file_path, 120);

  if (error || !data) return { ok: false, error: error?.message ?? 'SIGN_FAILED' };

  return { ok: true, url: data.signedUrl };
}

// ---------------------------------------------------------------------------
// Direct user creation — no invitation, no waiting for the person to sign up.
//
// This needs the service-role key because creating an auth user is an admin
// operation. The temporary password is returned exactly once so the super_admin
// can hand it over; it is never stored anywhere by us.
// ---------------------------------------------------------------------------

const CreateUserSchema = z.object({
  email: z.string().trim().email().max(160),
  full_name: z.string().trim().max(120).nullable(),
  role: z.enum(['super_admin', 'admin', 'editor', 'b2b_client', 'viewer']),
  password: z.string().min(10).max(72).nullable(),
});

/** Readable, high-entropy temporary password. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(20);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5, 10)}-${out.slice(10, 15)}-${out.slice(15, 20)}`;
}

export async function createUserDirect(
  _prev: (ActionResult & { password?: string }) | null,
  formData: FormData,
): Promise<ActionResult & { password?: string }> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = CreateUserSchema.safeParse({
    email: formData.get('email'),
    full_name: String(formData.get('full_name') ?? '').trim() || null,
    role: formData.get('role'),
    password: String(formData.get('password') ?? '').trim() || null,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' };
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return { ok: false, error: 'SERVICE_ROLE_MISSING' };
  }

  const password = parsed.data.password ?? generatePassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? 'CREATE_FAILED' };
  }

  // handle_new_user() has already inserted the profile row; set the role and
  // name on it. Done with the service-role client so the role guard trigger
  // sees current_user = 'service_role' and allows the assignment.
  const { error: profileError } = await admin
    .from('users_profiles')
    .update({
      role: parsed.data.role,
      full_name: parsed.data.full_name,
      is_active: true,
    })
    .eq('id', data.user.id);

  if (profileError) return { ok: false, error: profileError.message };

  await admin.from('tracking_events').insert({
    entity: 'users_profiles',
    entity_id: data.user.id,
    action: 'create',
    summary: `Created ${parsed.data.email} as ${parsed.data.role}`,
    actor_id: profile?.id ?? null,
    actor_email: profile?.email ?? null,
  });

  revalidatePath('/[lang]/admin/users', 'page');
  return { ok: true, password };
}
