'use server';

// app/[lang]/admin/(dashboard)/record-actions.ts
// One audited write path for the simple modules (tags, library, scenes, news,
// social). The table name is checked against an allow-list and the payload
// against that table's Zod schema before anything reaches Postgres — RLS is
// still the last line, this is the first.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff, hasRole } from '@/lib/auth/rbac';
import { TABLE_SCHEMAS, EDITOR_TABLES, isAdminTable, type AdminTable } from '@/lib/admin/schemas';
import type { ActionResult } from './actions';

const Id = z.string().uuid();

async function guard(table: string): Promise<{ ok: true; table: AdminTable } | ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };
  if (!isAdminTable(table)) return { ok: false, error: 'UNKNOWN_TABLE' };

  // An editor may only touch the content tables.
  if (!EDITOR_TABLES.includes(table) && !hasRole(profile, 'super_admin', 'admin')) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  return { ok: true, table };
}

/** Turns the flat form into the shape the schema expects (i18n groups included). */
function collect(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, raw] of formData.entries()) {
    if (key === 'id' || key === 'table') continue;
    const value = typeof raw === 'string' ? raw : '';

    // `title.en` → { title: { en: … } }
    const dot = key.indexOf('.');
    if (dot > 0) {
      const parent = key.slice(0, dot);
      const child = key.slice(dot + 1);
      const group = (out[parent] ??= {}) as Record<string, string>;
      if (value) group[child] = value;
      continue;
    }

    out[key] = value === 'on' ? true : value;
  }

  return out;
}

export async function saveRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gate = await guard(String(formData.get('table') ?? ''));
  if (!('table' in gate)) return gate;

  const schema = TABLE_SCHEMAS[gate.table];
  const parsed = schema.safeParse(collect(formData));

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'INVALID_INPUT' };
  }

  const rawId = String(formData.get('id') ?? '').trim();
  const id = rawId ? Id.safeParse(rawId) : null;
  if (rawId && !id?.success) return { ok: false, error: 'INVALID_ID' };

  const supabase = await createSupabaseServerClient();

  // supabase-js types Insert/Update per table; `gate.table` is a union, so the
  // payload type collapses to `never`. The schema above is the real guarantee —
  // one cast at the boundary keeps the rest honestly typed.
  const writer = supabase.from(gate.table) as unknown as {
    update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
    insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };

  const payload = parsed.data as Record<string, unknown>;

  const { error } = id?.success
    ? await writer.update(payload).eq('id', id.data)
    : await writer.insert(payload);

  if (error) return { ok: false, error: error.message };

  const profile = await getCurrentProfile();
  await supabase.from('tracking_events').insert({
    entity: gate.table,
    entity_id: id?.success ? id.data : null,
    action: id?.success ? 'update' : 'create',
    actor_id: profile?.id ?? null,
    actor_email: profile?.email ?? null,
  });

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

export async function deleteRecord(table: string, id: string): Promise<ActionResult> {
  const gate = await guard(table);
  if (!('table' in gate)) return gate;

  const parsedId = Id.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'INVALID_ID' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from(gate.table).delete().eq('id', parsedId.data);
  if (error) return { ok: false, error: error.message };

  const profile = await getCurrentProfile();
  await supabase.from('tracking_events').insert({
    entity: gate.table,
    entity_id: parsedId.data,
    action: 'delete',
    actor_id: profile?.id ?? null,
    actor_email: profile?.email ?? null,
  });

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}

/**
 * Notifications: mark one, or all, as read.
 *
 * The notifications page mixes stored rows with LIVE alerts derived on each
 * request — an expiring licence, a new submission — and gives those synthetic
 * ids like `licence-<uuid>`. Those are not rows in `notifications`, so passing
 * one to `.eq('id', …)` makes Postgres reject it as an invalid uuid and the
 * operator sees a raw database error on an alert that can never be dismissed.
 *
 * A derived alert has nothing to persist: it disappears on its own when the
 * condition clears. So a non-uuid id is a no-op success, not an error.
 */
export async function markNotification(id: string | null): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return { ok: false, error: 'FORBIDDEN' };

  if (id !== null) {
    const parsedId = Id.safeParse(id);
    // Derived alert — acknowledge the click without touching the table.
    if (!parsedId.success) return { ok: true };
    id = parsedId.data;
  }

  const supabase = await createSupabaseServerClient();
  const query = supabase.from('notifications').update({ is_read: true });

  const { error } = id ? await query.eq('id', id) : await query.eq('is_read', false);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/[lang]/admin', 'layout');
  return { ok: true };
}
