// app/[lang]/admin/(dashboard)/leads/page.tsx — SERVER COMPONENT
// Everyone who opened the licensing catalogue without an account. RLS makes
// this list staff-only; the buyers themselves can never read it back.
import { notFound, redirect } from 'next/navigation';
import { Mail, Phone } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, hasRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!hasRole(profile, 'super_admin', 'admin')) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('b2b_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = data ?? [];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.leads}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{dict.admin.noLeads}</p>
      ) : (
        <div className="mt-8 max-w-5xl space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.full_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.position} · {r.company}
                  </p>
                </div>

                <div className="text-end">
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-primary">
                    {r.downloads} {dict.admin.downloads}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline" dir="ltr">
                  <Phone className="size-3.5" />
                  {r.phone}
                </a>
                {r.email && (
                  <a href={`mailto:${r.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline" dir="ltr">
                    <Mail className="size-3.5" />
                    {r.email}
                  </a>
                )}
                {r.country && <span className="text-xs text-muted-foreground">{r.country}</span>}
              </div>

              {r.interest && (
                <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {r.interest}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
