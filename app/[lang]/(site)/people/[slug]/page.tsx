// app/[lang]/(site)/people/[slug]/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPersonBySlug } from '@/lib/queries/catalog';

export const revalidate = 900;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const [dict, person] = await Promise.all([getDictionary(lang), getPersonBySlug(slug, lang)]);
  if (!person) return {};

  return buildMetadata({
    lang,
    title: person.name,
    description: person.bio.slice(0, 160) || dict.meta.description,
    siteName: dict.meta.siteName,
    path: `people/${slug}`,
    image: person.photoUrl ?? undefined,
  });
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, person] = await Promise.all([getDictionary(locale), getPersonBySlug(slug, locale)]);

  if (!person) notFound();

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-24 md:px-10 xl:px-16">
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end">
        <div className="relative size-36 shrink-0 overflow-hidden rounded-full bg-neutral-900 ring-1 ring-white/[0.08] md:size-44">
          {person.photoUrl && (
            <Image src={person.photoUrl} alt={person.name} fill sizes="176px" className="object-cover" />
          )}
        </div>

        <div>
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] font-light text-neutral-50">
            {person.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-6 text-xs text-neutral-500">
            {person.birthYear && (
              <span>
                {dict.detail.born} {person.birthYear}
              </span>
            )}
            {person.nationality && (
              <span>
                {dict.detail.nationality} {person.nationality}
              </span>
            )}
          </div>
        </div>
      </header>

      {person.bio && (
        <p className="mt-10 max-w-3xl text-[0.95rem] leading-relaxed text-neutral-300">{person.bio}</p>
      )}

      {person.titles.length > 0 && (
        <section className="mt-16">
          <h2 className="text-[0.65rem] uppercase tracking-[0.24em] text-primary">
            {dict.detail.filmography}
          </h2>

          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {person.titles.map((t) => (
              <li key={`${t.slug}-${t.role}`}>
                <Link href={`/${locale}/series/${t.slug}`} className="group block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-neutral-900 ring-1 ring-white/[0.06] transition-all group-hover:ring-primary/45">
                    {t.posterUrl && (
                      <Image src={t.posterUrl} alt={t.title} fill sizes="16vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-neutral-200 transition-colors group-hover:text-primary">
                    {t.title}
                  </p>
                  {t.role && <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{t.role}</p>}
                  {t.year && <p className="text-xs text-neutral-600">{t.year}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
