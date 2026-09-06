// app/[lang]/(site)/partners/[slug]/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPartnerBySlug, getPartners } from '@/lib/queries/catalog';
import { MediaCard } from '@/components/site/media-card';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';

export const revalidate = 3600;

export async function generateStaticParams() {
  const partners = await getPartners();
  return partners.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const [dict, partner] = await Promise.all([getDictionary(lang), getPartnerBySlug(slug, lang)]);
  if (!partner) return {};

  return buildMetadata({
    lang,
    title: `${partner.name} — ${dict.partners.title}`,
    description: dict.partners.lead,
    siteName: dict.meta.siteName,
    path: `partners/${slug}`,
    image: partner.logoUrl ?? undefined,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, partner] = await Promise.all([getDictionary(locale), getPartnerBySlug(slug, locale)]);

  if (!partner) notFound();

  const labels = {
    new: dict.catalog.new,
    comingSoon: dict.catalog.comingSoon,
    seasons: dict.catalog.seasons,
  };

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-20 md:px-10 md:py-28 xl:px-16">
      <Link
        href={`/${locale}/partners`}
        className="text-[0.65rem] uppercase tracking-[0.24em] text-primary hover:underline"
      >
        {dict.partners.title}
      </Link>

      <Reveal as="header" className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-6 border-b border-border pb-10">
        {partner.logoUrl && (
          <div className="flex h-16 items-center">
            <Image
              src={partner.logoUrl}
              alt={partner.name}
              width={200}
              height={64}
              className="h-14 w-auto object-contain"
            />
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-display text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight">
            {partner.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {partner.titles.length} {dict.partners.titles}
          </p>
        </div>

        {partner.siteUrl && (
          <a
            href={partner.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="ms-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary hover:underline"
          >
            {dict.partners.visit}
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </Reveal>

      {partner.titles.length === 0 ? (
        <p className="mt-16 text-sm text-muted-foreground">{dict.partners.noTitles}</p>
      ) : (
        <>
          <h2 className="mt-14 text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            {dict.partners.acquired}
          </h2>

          <RevealGroup className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {partner.titles.map((item, i) => (
              <RevealItem key={item.id}>
                <MediaCard lang={locale} item={item} labels={labels} priority={i < 6} />
              </RevealItem>
            ))}
          </RevealGroup>
        </>
      )}
    </main>
  );
}
