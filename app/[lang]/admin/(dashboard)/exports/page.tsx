// app/[lang]/admin/(dashboard)/exports/page.tsx — SERVER COMPONENT
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileDown, ExternalLink } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { Button } from '@/components/ui/button';

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
    .from('exports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = data ?? [];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.exports}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="gold" size="sm">
          <a href={`/api/generate-b2b-pdf?lang=${locale}&status=available`} target="_blank" rel="noreferrer">
            <FileDown />
            {dict.b2b.downloadPdf}
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/b2b`}>
            {dict.nav.b2b}
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{dict.admin.noExports}</p>
      ) : (
        <div className="mt-8 max-w-4xl space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
              <div className="min-w-[10rem] flex-1">
                <p className="text-sm font-medium">{r.kind}</p>
                <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">{r.format}</span>
              {r.row_count !== null && (
                <span className="text-xs tabular-nums text-muted-foreground">{r.row_count}</span>
              )}
              {r.file_url && (
                <Button asChild variant="ghost" size="sm" className="ms-auto">
                  <a href={r.file_url} target="_blank" rel="noreferrer">
                    <FileDown className="size-3.5" />
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
