// app/[lang]/admin/(dashboard)/appearance/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_SETTINGS } from '@/lib/queries/settings';
import { AppearanceForm } from '@/components/admin/appearance-form';

export const dynamic = 'force-dynamic';

export default async function AppearancePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', true).maybeSingle();

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.appearance.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{dict.appearance.hint}</p>

      <div className="mt-8">
        <AppearanceForm
          values={{ ...DEFAULT_SETTINGS, ...(data ?? {}) }}
          dict={dict.appearance}
          labels={{ save: dict.admin.save, saved: dict.admin.saved }}
          uploadDict={dict.upload}
        />
      </div>
    </div>
  );
}
