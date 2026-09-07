// app/[lang]/admin/(dashboard)/appearance/page.tsx — SERVER COMPONENT
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCurrentProfile, isAdmin } from '@/lib/auth/rbac';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_SETTINGS, mergeSettings } from '@/lib/queries/settings';
import { AppearanceForm } from '@/components/admin/appearance-form';
import { HeroPicks, type PickCard } from '@/components/admin/hero-picks';
import { t } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AppearancePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;

  // The sidebar hides this module from editors; a guessable URL is not access
  // control, so the page enforces the same rule the actions do.
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/${locale}/403`);
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const [{ data }, { data: titles }] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', true).maybeSingle(),
    supabase
      .from('series')
      .select('id, slug, title, year, poster_url, is_featured_slider')
      .eq('status', 'published')
      .not('poster_url', 'is', null)
      .order('is_featured_slider', { ascending: false })
      .order('year', { ascending: false, nullsFirst: false })
      .limit(60),
  ]);

  const picks: PickCard[] = (titles ?? []).map((row) => ({
    id: row.id,
    title: t(row.title, locale, row.slug),
    year: row.year,
    posterUrl: row.poster_url,
    picked: row.is_featured_slider,
  }));

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.appearance.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{dict.appearance.hint}</p>

      <div className="mt-8">
        <HeroPicks
          rows={picks}
          dict={{
            title: dict.appearance.heroPicks,
            hint: dict.appearance.heroPicksHint,
            count: dict.appearance.heroPicksCount,
            saved: dict.admin.saved,
            empty: dict.admin.noRecords,
          }}
        />
      </div>

      <div className="mt-8">
        <AppearanceForm
          values={data ? mergeSettings(data) : DEFAULT_SETTINGS}
          dict={dict.appearance}
          labels={{ save: dict.admin.save, saved: dict.admin.saved }}
          uploadDict={dict.upload}
        />
      </div>
    </div>
  );
}
