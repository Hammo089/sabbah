// app/[lang]/admin/(dashboard)/ticker/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TickerManager } from '@/components/admin/ticker-manager';

export const dynamic = 'force-dynamic';

export default async function AdminTickerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const [{ data: rows }, { data: settings }] = await Promise.all([
    supabase.from('news_ticker').select('*').order('priority', { ascending: false }),
    supabase.from('site_settings').select('ticker_enabled').eq('id', true).maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.ticker}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {settings?.ticker_enabled === false ? dict.admin.tickerHidden : dict.admin.tickerVisible}
      </p>

      <div className="mt-8">
        <TickerManager
          rows={(rows ?? []).map((r) => ({
            id: r.id,
            message: (r.message ?? {}) as Record<string, string>,
            link_url: r.link_url,
            priority: r.priority,
            is_active: r.is_active,
          }))}
          labels={{ save: dict.admin.save, saved: dict.admin.saved, remove: dict.admin.remove, add: dict.admin.addItem }}
        />
      </div>
    </div>
  );
}
