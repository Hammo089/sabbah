// lib/admin/module-page.ts
import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { t } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/** Titles for the series pickers the module forms use. */
export async function seriesOptions(lang: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('series').select('id, slug, title').order('sort_order').limit(500);
  return (data ?? []).map((s) => ({ value: s.id, label: t(s.title, lang, s.slug) }));
}

export const MANAGER_DICT = (d: {
  add: string; save: string; saved: string; remove: string; cancel: string; empty: string;
}) => d;
