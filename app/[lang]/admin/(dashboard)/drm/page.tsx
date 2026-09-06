// app/[lang]/admin/(dashboard)/drm/page.tsx — SERVER COMPONENT
// super_admin only: licence rows carry fees, contract refs and key ids.
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isSuperAdmin } from '@/lib/auth/rbac';
import { LicenceManager, type LicenceRow } from '@/components/admin/licence-manager';
import { t } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDrmPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const [{ data: licences }, { data: titles }, { data: companies }] = await Promise.all([
    supabase
      .from('drm_licenses')
      .select('*, series(slug, title)')
      .order('ends_on', { ascending: true, nullsFirst: false })
      .limit(500),
    supabase.from('series').select('id, slug, title').order('sort_order').limit(500),
    supabase.from('broadcasters').select('id, name').order('sort_order'),
  ]);

  type Raw = LicenceRow & { series: { slug: string; title: unknown } | null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: LicenceRow[] = ((licences ?? []) as unknown as Raw[]).map((r) => {
    const daysLeft = r.ends_on
      ? Math.round((new Date(r.ends_on).getTime() - today.getTime()) / 86_400_000)
      : null;

    return {
      ...r,
      titleLabel: r.series ? t(r.series.title, locale, r.series.slug) : '—',
      daysLeft,
    };
  });

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.drm}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8">
        <LicenceManager
          rows={rows}
          titles={(titles ?? []).map((s) => ({ id: s.id, label: t(s.title, locale, s.slug) }))}
          companies={(companies ?? []).map((c) => ({ id: c.id, label: c.name }))}
          dict={dict.licence}
        />
      </div>
    </div>
  );
}
