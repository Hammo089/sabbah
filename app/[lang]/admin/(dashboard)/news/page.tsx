// app/[lang]/admin/(dashboard)/news/page.tsx — SERVER COMPONENT
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

  const { data } = await supabase
    .from('news_press')
    .select('*')
    .order('published_on', { ascending: false, nullsFirst: false })
    .limit(300);

  const fields: Field[] = [
    { name: 'slug', label: 'Slug', required: true, dir: 'ltr' },
    { name: 'outlet', label: dict.admin.outlet },
    { name: 'published_on', label: dict.admin.publishedOn, type: 'date', dir: 'ltr' },
    { name: 'title', label: dict.admin.label, type: 'i18n' },
    { name: 'excerpt', label: dict.admin.excerpt, type: 'i18n' },
    { name: 'body', label: dict.admin.notes, type: 'i18n' },
    { name: 'cover_url', label: 'Cover URL', type: 'url', dir: 'ltr', span: 2 },
    { name: 'external_url', label: 'External URL', type: 'url', dir: 'ltr', span: 2 },
    { name: 'sort_order', label: dict.admin.sortOrder, type: 'number' },
    { name: 'is_published', label: dict.admin.published, type: 'switch' },
  ];

  const rows: RecordRow[] = (data ?? []).map((r) => ({
    id: r.id,
    primary: t(r.title, locale, r.slug),
    secondary: [r.outlet, r.published_on].filter(Boolean).join(' · ') || null,
    badge: r.is_published ? dict.admin.published : dict.admin.draft,
    values: r as unknown as Record<string, unknown>,
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
      <h1 className="text-display text-2xl font-light">{dict.admin.newsPress}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8 max-w-5xl">
        <RecordManager table="news_press" fields={fields} rows={rows} dict={manager} />
      </div>
    </div>
  );
}
