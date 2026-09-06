// app/[lang]/(site)/scripts/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getCatalog } from '@/lib/queries/catalog';
import { MediaCard } from '@/components/site/media-card';

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.catalog.scriptsTitle,
    description: dict.catalog.scriptsDesc,
    siteName: dict.meta.siteName,
    path: 'scripts',
  });
}

export default async function ScriptsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const { items, total } = await getCatalog(locale, { script: true }, 60, 0);

  const labels = { new: dict.catalog.new, comingSoon: dict.catalog.comingSoon, seasons: dict.catalog.seasons };

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-16 md:px-10 md:py-24 xl:px-16">
      <h1 className="text-display text-[clamp(2rem,4vw,3.2rem)] font-light">{dict.catalog.scriptsTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{dict.catalog.scriptsDesc}</p>

      {items.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">{dict.catalog.empty}</p>
      ) : (
        <>
          <p className="mt-8 text-xs text-muted-foreground">
            {total} {dict.catalog.results}
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item, i) => (
              <li key={item.id}>
                <MediaCard lang={locale} item={item} labels={labels} priority={i < 6} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
