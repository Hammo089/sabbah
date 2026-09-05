// app/[lang]/(site)/legacy/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { createSupabaseAnonClient } from '@/lib/supabase/server';
import { PageShell } from '@/components/site/page-shell';
import { Reveal } from '@/components/motion/reveal';
import { LegacyPlayer } from '@/components/site/legacy-player';
import { t } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.legacy.title,
    description: dict.legacy.subtitle,
    siteName: dict.meta.siteName,
    path: 'legacy',
  });
}

export default async function LegacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  let rows: { id: string; title: unknown; description: unknown; video_url: string | null; poster_url: string | null; year: number | null }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createSupabaseAnonClient();
      const { data } = await supabase
        .from('company_legacy')
        .select('id, title, description, video_url, poster_url, year')
        .eq('is_published', true)
        .order('year', { ascending: true })
        .order('sort_order', { ascending: true });
      rows = data ?? [];
    } catch (error) {
      console.error('[legacy]', error);
    }
  }

  const feature = rows.find((r) => r.video_url);

  return (
    <PageShell eyebrow={dict.nav.legacy} title={dict.legacy.title} lead={dict.legacy.subtitle}>
      {feature?.video_url && (
        <div className="mt-14">
          <LegacyPlayer
            src={feature.video_url}
            poster={feature.poster_url}
            label={dict.legacy.watch}
          />
        </div>
      )}

      {rows.length > 0 && (
        <ol className="mt-20">
          {rows.map((row, i) => (
            <Reveal key={row.id} as="li" delay={i * 0.04}>
              <div className="grid grid-cols-[auto_1fr] gap-6 border-t border-white/[0.07] py-8">
                <span className="text-display text-2xl font-light text-primary md:text-3xl">
                  {row.year ?? '—'}
                </span>
                <div>
                  <h2 className="text-lg text-neutral-100">{t(row.title, locale, '')}</h2>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-neutral-400">
                    {t(row.description, locale, '')}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      )}
    </PageShell>
  );
}
