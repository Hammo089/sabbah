// app/[lang]/admin/(dashboard)/drm/page.tsx — SERVER COMPONENT
// super_admin only: this table holds licence keys, fees and contract refs.
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isSuperAdmin } from '@/lib/auth/rbac';
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

  const { data } = await supabase
    .from('drm_licenses')
    .select('id, licensee_name, territory, rights, drm, status, starts_on, ends_on, fee_usd, series(slug, title)')
    .order('created_at', { ascending: false })
    .limit(200);

  type Row = {
    id: string; licensee_name: string; territory: string[] | null; rights: string[] | null;
    drm: string; status: string; starts_on: string | null; ends_on: string | null;
    fee_usd: number | null; series: { slug: string; title: unknown } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.drm}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      {rows.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">{dict.admin.noResults}</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="p-3 text-start font-medium">{dict.admin.series}</th>
                <th className="p-3 text-start font-medium">Licensee</th>
                <th className="p-3 text-start font-medium">Territory</th>
                <th className="p-3 text-start font-medium">Rights</th>
                <th className="p-3 text-start font-medium">DRM</th>
                <th className="p-3 text-start font-medium">{dict.admin.status}</th>
                <th className="p-3 text-start font-medium">Window</th>
                <th className="p-3 text-end font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {r.series ? (
                      <Link href={`/${locale}/series/${r.series.slug}`} className="hover:text-primary">
                        {t(r.series.title, locale, r.series.slug)}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">{r.licensee_name}</td>
                  <td className="p-3 text-muted-foreground">{(r.territory ?? []).join(', ') || '—'}</td>
                  <td className="p-3 text-muted-foreground">{(r.rights ?? []).join(' / ') || '—'}</td>
                  <td className="p-3 text-muted-foreground">{r.drm}</td>
                  <td className="p-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">{r.status}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground" dir="ltr">
                    {r.starts_on ?? '—'} → {r.ends_on ?? '—'}
                  </td>
                  <td className="p-3 text-end tabular-nums">
                    {r.fee_usd ? `$${Number(r.fee_usd).toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
