// app/[lang]/admin/(dashboard)/library/page.tsx — SERVER COMPONENT
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
    supabase.from('library_items').select('*').order('created_at', { ascending: false }).limit(500),
    seriesOptions(locale),
  ]);

  const fields: Field[] = [
    { name: 'label', label: dict.admin.label, required: true, span: 2 },
    { name: 'series_id', label: dict.admin.seasons, type: 'select', options: titles },
    { name: 'kind', label: dict.admin.kind, type: 'select', options: [
      { value: 'master', label: 'Master' }, { value: 'mezzanine', label: 'Mezzanine' },
      { value: 'proxy', label: 'Proxy' }, { value: 'audio', label: 'Audio' },
      { value: 'subtitle', label: 'Subtitle' }, { value: 'document', label: 'Document' },
      { value: 'artwork', label: 'Artwork' }, { value: 'other', label: 'Other' },
    ] },
    { name: 'format', label: 'Format', dir: 'ltr' },
    { name: 'resolution', label: 'Resolution', dir: 'ltr' },
    { name: 'duration_s', label: 'Duration (s)', type: 'number' },
    { name: 'size_mb', label: 'Size (MB)', type: 'number' },
    { name: 'location', label: dict.admin.location, span: 2 },
    { name: 'barcode', label: 'Barcode', dir: 'ltr' },
    { name: 'file_url', label: 'File URL', type: 'url', dir: 'ltr', span: 2 },
    { name: 'notes', label: dict.admin.notes, type: 'textarea', span: 3 },
  ];

  const rows: RecordRow[] = (data ?? []).map((r) => ({
    id: r.id,
    primary: r.label,
    secondary: [r.format, r.resolution, r.location].filter(Boolean).join(' · ') || null,
    badge: r.kind,
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
      <h1 className="text-display text-2xl font-light">{dict.admin.library}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8 max-w-5xl">
        <RecordManager table="library_items" fields={fields} rows={rows} dict={manager} />
      </div>
    </div>
  );
}
