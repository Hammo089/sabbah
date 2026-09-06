// app/[lang]/admin/(dashboard)/tags/page.tsx — SERVER COMPONENT
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { RecordManager, type Field, type RecordRow } from '@/components/admin/record-manager';
import { t } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from('tags').select('*').order('sort_order');

  const fields: Field[] = [
    { name: 'slug', label: 'Slug', required: true, dir: 'ltr' },
    { name: 'label', label: dict.admin.tags, type: 'i18n' },
    { name: 'color', label: 'Colour', type: 'color' },
    { name: 'sort_order', label: dict.admin.sortOrder, type: 'number' },
  ];

  const rows: RecordRow[] = (data ?? []).map((r) => ({
    id: r.id,
    primary: t(r.label, locale, r.slug),
    secondary: r.slug,
    badge: r.color,
    values: { slug: r.slug, label: r.label, color: r.color, sort_order: r.sort_order },
  }));

  const manager = {
    add: dict.admin.addItem,
    save: dict.admin.save,
    saved: dict.admin.saved,
    remove: dict.admin.remove,
    cancel: dict.admin.cancel,
    empty: dict.admin.noRecords,
  };

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.tags}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8 max-w-5xl">
        <RecordManager table="tags" fields={fields} rows={rows} dict={manager} />
      </div>
    </div>
  );
}
