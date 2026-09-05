// app/[lang]/admin/(dashboard)/programs/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from('programs').select('id', { count: 'exact', head: true });

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.programs}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{count ?? 0}</p>

      <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">{dict.admin.comingSoonSection}</p>
        <Link
          href={`/${locale}/admin/series`}
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          {dict.admin.series}
        </Link>
      </div>
    </div>
  );
}
