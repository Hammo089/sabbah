'use server';

// app/[lang]/admin/(dashboard)/video-actions.ts
// The videos attached to one title — trailer, teasers, clips, behind-the-scenes.

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { youtubeId as parseYouTubeId } from '@/lib/media/video-source';
import type { ActionResult } from './actions';

const Id = z.string().uuid();

const VIDEO_KINDS = [
  'trailer',
  'teaser',
  'clip',
  'opening',
  'behind_scenes',
  'interview',
  'promo',
] as const;

/**
 * `.max()` must come BEFORE `.refine()`: refine returns a ZodEffects, which has
 * no string methods left to chain. Kept as a factory so each field states its
 * own limit rather than sharing one.
 */
const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .url()
    .max(max)
    .refine((v) => /^https?:\/\//i.test(v), 'HTTP_ONLY');

const VideoSchema = z.object({
  id: Id.optional(),
  seriesId: Id,
  kind: z.enum(VIDEO_KINDS),
  label: z.record(z.string(), z.string().max(120)).default({}),
  /**
   * Accepts anything the operator has: a full watch/share/shorts URL or a bare
   * id. Normalised to the 11-char id here, because the CHECK constraint on the
   * column rejects a pasted URL — the DB is the backstop, this is the fix.
   */
  youtubeInput: z.string().trim().max(300).optional(),
  url: httpUrl(600).optional().or(z.literal('')),
  thumbnailUrl: httpUrl(600).optional().or(z.literal('')),
  durationSeconds: z.coerce.number().int().positive().max(86_399).optional().nullable(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type VideoInput = z.input<typeof VideoSchema>;

export async function saveTitleVideo(input: VideoInput): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = VideoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const v = parsed.data;

  // Normalise before validating "has a source": a pasted watch URL IS a valid
  // YouTube source, it just is not an id yet.
  const youtube = v.youtubeInput ? parseYouTubeId(v.youtubeInput) : null;
  if (v.youtubeInput && !youtube) return { ok: false, error: 'BAD_YOUTUBE_ID' };

  const fileUrl = v.url && v.url.length > 0 ? v.url : null;
  if (!youtube && !fileUrl) return { ok: false, error: 'NO_SOURCE' };

  const supabase = await createSupabaseServerClient();

  // At most one primary per title is enforced by a partial unique index, which
  // would otherwise reject this write. Demote the incumbent first so "make this
  // the primary" behaves like a radio button rather than an error.
  if (v.isPrimary) {
    const demote = supabase
      .from('title_videos')
      .update({ is_primary: false })
      .eq('series_id', v.seriesId)
      .eq('is_primary', true);

    const { error } = v.id ? await demote.neq('id', v.id) : await demote;
    if (error) return { ok: false, error: error.message };
  }

  const row = {
    series_id: v.seriesId,
    kind: v.kind,
    label: v.label,
    youtube_id: youtube,
    url: fileUrl,
    thumbnail_url: v.thumbnailUrl && v.thumbnailUrl.length > 0 ? v.thumbnailUrl : null,
    duration_seconds: v.durationSeconds ?? null,
    is_primary: v.isPrimary,
    sort_order: v.sortOrder,
  };

  const { error } = v.id
    ? await supabase.from('title_videos').update(row).eq('id', v.id)
    : await supabase.from('title_videos').insert(row);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  revalidatePath('/[lang]/(site)/series/[slug]', 'page');
  revalidatePath('/[lang]/(site)/movies/[slug]', 'page');
  return { ok: true };
}

export async function deleteTitleVideo(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  const parsed = Id.safeParse(id);
  if (!parsed.success) return { ok: false, error: 'INVALID_ID' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('title_videos').delete().eq('id', parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  revalidatePath('/[lang]/(site)/series/[slug]', 'page');
  revalidatePath('/[lang]/(site)/movies/[slug]', 'page');
  return { ok: true };
}
