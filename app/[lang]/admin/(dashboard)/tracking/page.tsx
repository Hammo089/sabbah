// app/[lang]/admin/(dashboard)/tracking/page.tsx — SERVER COMPONENT
// The audit trail. Read-only by design: an append-only log that anyone can
// silently edit is not a log.
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, hasRole } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-500',
  update: 'bg-primary/15 text-primary',
  delete: 'bg-destructive/15 text-destructive',
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!hasRole(profile, 'super_admin', 'admin')) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('tracking_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  const rows = data ?? [];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.tracking}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{dict.admin.noActivity}</p>
      ) : (
        <div className="mt-8 max-w-5xl overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="p-3 text-start font-medium">{dict.admin.when}</th>
                <th className="p-3 text-start font-medium">{dict.admin.action}</th>
                <th className="p-3 text-start font-medium">{dict.admin.entity}</th>
                <th className="p-3 text-start font-medium">{dict.admin.actor}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap p-3 text-xs text-muted-foreground" dir="ltr">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider',
                        TONE[r.action] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {r.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="text-xs">{r.entity}</p>
                    {r.summary && <p className="mt-0.5 text-xs text-muted-foreground">{r.summary}</p>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground" dir="ltr">
                    {r.actor_email ?? '—'}
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
