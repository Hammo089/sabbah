// app/[lang]/(site)/(home)/page.tsx
// SERVER COMPONENT.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { SplitHero } from '@/components/site/hero/split-hero';
import { HeroSkeleton } from '@/components/site/hero/hero-skeleton';

export const revalidate = 900; // ISR — 15 min

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
    type: 'website',
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <SplitHero lang={locale} dict={dict} />
      </Suspense>

      {/* Subsequent rails (catalog, legacy teaser, news) mount here. */}
    </>
  );
}
