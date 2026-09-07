// app/[lang]/admin/(dashboard)/scenes/page.tsx — SERVER COMPONENT
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { RecordManager, type Field, type RecordRow } from '@/components/admin/record-manager';
import { seriesOptions } from '@/lib/admin/module-page';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const [{ data }, titles] = await Promise.all([
    supabase.from('master_scenes').select('*').order('scene_no').limit(1000),
    seriesOptions(locale),
  ]);

  const fields: Field[] = [
    { name: 'series_id', label: dict.admin.seasons, type: 'select', options: titles, span: 2 },
    { name: 'scene_no', label: 'Scene #', type: 'number' },
    { name: 'tc_in', label: 'TC in', dir: 'ltr', placeholder: '00:00:00:00' },
    { name: 'tc_out', label: 'TC out', dir: 'ltr', placeholder: '00:00:00:00' },
    { name: 'location', label: dict.admin.location },
    { name: 'heading', label: dict.admin.label, span: 3 },
    { name: 'description', label: dict.admin.notes, type: 'textarea', span: 3 },
    { name: 'still_url', label: 'Still URL', type: 'url', dir: 'ltr', span: 2 },
  ];

  const rows: RecordRow[] = (data ?? []).map((r) => ({
    id: r.id,
    primary: r.heading ?? `Scene ${r.scene_no ?? '—'}`,
    secondary: [r.tc_in, r.tc_out].filter(Boolean).join(' → ') || r.location,
    badge: r.scene_no !== null ? `#${r.scene_no}` : null,
    values: r as unknown as Record<string, unknown>,
  }));

  const manager = {
    add: dict.admin.addItem,
    save: dict.admin.save,
    saved: dict.admin.saved,
    remove: dict.admin.remove,
    cancel: dict.admin.cancel,
    empty: dict.admin.noRecords,
    edit: dict.admin.edit,
    delete: dict.admin.delete,
    confirmDelete: dict.admin.confirmDelete,
  };

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.masterScenes}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8 max-w-5xl">
        <RecordManager table="master_scenes" fields={fields} rows={rows} dict={manager} />
      </div>
    </div>
  );
}
