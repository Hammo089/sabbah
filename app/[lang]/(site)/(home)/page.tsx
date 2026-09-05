// app/[lang]/(site)/(home)/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRails } from '@/lib/queries/catalog';
import { SplitHero } from '@/components/site/hero/split-hero';
import { HeroSkeleton } from '@/components/site/hero/hero-skeleton';
import { MediaRail } from '@/components/site/media-rail';

export const revalidate = 900;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: `${dict.meta.siteName} — ${dict.meta.tagline}`,
    description: dict.meta.description,
    siteName: dict.meta.siteName,
    path: '',
  });
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const rails = await getRails(locale);

  const labels = {
    new: dict.catalog.new,
    comingSoon: dict.catalog.comingSoon,
    seasons: dict.catalog.seasons,
    viewAll: dict.common.viewAll,
  };

  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <SplitHero lang={locale} dict={dict} />
      </Suspense>

      <MediaRail lang={locale} title={dict.catalog.hits} items={rails.hits} href={`/${locale}/catalog`} labels={labels} />
      <MediaRail lang={locale} title={dict.catalog.fresh} items={rails.fresh} href={`/${locale}/catalog`} labels={labels} />
      <MediaRail lang={locale} title={dict.catalog.soon} items={rails.soon} labels={labels} />
    </>
  );
}
