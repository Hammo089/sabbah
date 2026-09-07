// lib/admin/schemas.ts
import 'server-only';
import { z } from 'zod';

/**
 * The allow-list behind the generic record editor.
 *
 * Nothing here is driven by what the browser sends: the table name must be a
 * key of this map, and every field is validated by the Zod schema attached to
 * it. A payload naming a column that is not listed is dropped, so the generic
 * endpoint can never be steered at `users_profiles` or `drm_licenses`.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;
const SLUG = /^[a-z0-9-]+$/;

const i18n = z
  .object({ ar: z.string().max(4000).optional(), en: z.string().max(4000).optional(), fr: z.string().max(4000).optional() })
  .partial();

const nullableUrl = z.string().url().max(600).nullable().or(z.literal('')).transform((v) => v || null);
const nullableText = (max: number) =>
  z.string().max(max).nullable().or(z.literal('')).transform((v) => (v ? v : null));
const nullableUuid = z.string().uuid().nullable().or(z.literal('')).transform((v) => v || null);
/**
 * A blank numeric field means "not set", not zero.
 *
 * The previous shape put `z.coerce.number()` FIRST, and coercion turns '' into
 * 0 — so the first branch always succeeded, the `.or(z.literal(''))` fallback
 * and the `v === ''` transform were both unreachable, and clearing a duration
 * or a follower count silently stored 0. Checking for the empty string before
 * coercing is what makes the null path reachable.
 */
const nullableInt = (min: number, max: number) =>
  z
    .union([z.literal(''), z.null(), z.coerce.number().int().min(min).max(max)])
    .transform((v) => (v === '' || v === null ? null : v));

/**
 * A DATE column: anything ≤10 characters used to pass Zod and then fail in
 * Postgres, surfacing a raw driver error to the operator. Validate the shape
 * AND that it is a real calendar date — '2026-02-31' is neither.
 */
const nullableDate = z
  .union([z.literal(''), z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')])
  .transform((v) => (v ? v : null))
  .refine((v) => {
    if (v === null) return true;
    // Round-trip rather than trusting Date to reject: V8 happily rolls
    // '2026-02-31' forward to March 3 instead of returning Invalid Date, so the
    // only reliable check is that the parsed date prints back as what was typed.
    const parsed = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
  }, 'INVALID_DATE');

export const TABLE_SCHEMAS = {
  tags: z.object({
    slug: z.string().min(2).max(60).regex(SLUG),
    label: i18n,
    color: z.string().regex(HEX).default('#2c845c'),
    sort_order: z.coerce.number().int().min(0).max(999).default(0),
  }),

  library_items: z.object({
    series_id: nullableUuid,
    kind: z.enum(['master', 'mezzanine', 'proxy', 'audio', 'subtitle', 'document', 'artwork', 'other']),
    label: z.string().min(1).max(200),
    format: nullableText(60),
    resolution: nullableText(40),
    duration_s: nullableInt(0, 1_000_000),
    size_mb: z.coerce.number().min(0).max(9_999_999).nullable().or(z.literal('')).transform((v) => (v === '' ? null : v)),
    location: nullableText(200),
    barcode: nullableText(80),
    file_url: nullableUrl,
    notes: nullableText(2000),
  }),

  master_scenes: z.object({
    series_id: nullableUuid,
    scene_no: nullableInt(0, 100000),
    tc_in: nullableText(20),
    tc_out: nullableText(20),
    heading: nullableText(200),
    description: nullableText(4000),
    location: nullableText(200),
    still_url: nullableUrl,
  }),

  news_press: z.object({
    slug: z.string().min(2).max(120).regex(SLUG),
    title: i18n,
    excerpt: i18n,
    body: i18n,
    cover_url: nullableUrl,
    outlet: nullableText(120),
    external_url: nullableUrl,
    published_on: nullableDate,
    is_published: z.boolean().default(false),
    sort_order: z.coerce.number().int().min(0).max(999).default(0),
  }),

  social_accounts: z.object({
    platform: z.enum(['instagram', 'youtube', 'facebook', 'twitter', 'tiktok', 'linkedin']),
    handle: z.string().min(1).max(120),
    profile_url: nullableUrl,
    followers: nullableInt(0, 2_000_000_000),
    is_primary: z.boolean().default(false),
    series_id: nullableUuid,
  }),
} as const;

export type AdminTable = keyof typeof TABLE_SCHEMAS;

export function isAdminTable(value: string): value is AdminTable {
  return Object.prototype.hasOwnProperty.call(TABLE_SCHEMAS, value);
}

/** Tables an editor may touch; the rest require admin or higher. */
export const EDITOR_TABLES: AdminTable[] = [
  'tags',
  'library_items',
  'master_scenes',
  'news_press',
  'social_accounts',
];
