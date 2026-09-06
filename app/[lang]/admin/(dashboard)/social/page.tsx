// app/[lang]/admin/(dashboard)/social/page.tsx — SERVER COMPONENT
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
    supabase.from('social_accounts').select('*').order('platform'),
    seriesOptions(locale),
  ]);

  const fields: Field[] = [
    { name: 'platform', label: dict.admin.platform, type: 'select', options: [
      { value: 'instagram', label: 'Instagram' }, { value: 'youtube', label: 'YouTube' },
      { value: 'facebook', label: 'Facebook' }, { value: 'twitter', label: 'X / Twitter' },
      { value: 'tiktok', label: 'TikTok' }, { value: 'linkedin', label: 'LinkedIn' },
    ] },
    { name: 'handle', label: dict.admin.handle, required: true, dir: 'ltr' },
    { name: 'followers', label: dict.admin.followers, type: 'number' },
    { name: 'profile_url', label: 'Profile URL', type: 'url', dir: 'ltr', span: 2 },
    { name: 'series_id', label: dict.admin.seasons, type: 'select', options: titles },
    { name: 'is_primary', label: dict.admin.primary, type: 'switch' },
  ];

  const rows: RecordRow[] = (data ?? []).map((r) => ({
    id: r.id,
    primary: r.handle,
    secondary: r.followers ? `${r.followers.toLocaleString()} ${dict.admin.followers}` : null,
    badge: r.platform,
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
      <h1 className="text-display text-2xl font-light">{dict.admin.social}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8 max-w-5xl">
        <RecordManager table="social_accounts" fields={fields} rows={rows} dict={manager} />
      </div>
    </div>
  );
}
