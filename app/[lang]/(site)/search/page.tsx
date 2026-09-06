// app/[lang]/(site)/search/page.tsx
// SERVER COMPONENT — full results page, shareable by URL.
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Search as SearchIcon, Film, Tv, Clapperboard } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { searchCatalog, sanitizeQuery, resultHref } from '@/lib/queries/search';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;
const TYPE_ICON = { series: Tv, movie: Film, program: Clapperboard } as const;
const ALLOWED_TYPES = ['series', 'movie', 'program'] as const;
type EntityType = (typeof ALLOWED_TYPES)[number];

type SearchParams = Promise<{ q?: string; type?: string; page?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { lang } = await params;
  const { q } = await searchParams;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  const term = sanitizeQuery(q);

  return buildMetadata({
    lang,
    title: term ? `${dict.search.resultsFor} "${term}"` : dict.search.title,
    description: dict.search.description,
    siteName: dict.meta.siteName,
    path: 'search',
    // Never index: query strings generate unbounded URLs and thin pages.
    noIndex: true,
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const { q, type, page } = await searchParams;
  const dict = await getDictionary(locale);

  const term = sanitizeQuery(q);
  const pageNumber = Math.max(Number.parseInt(page ?? '1', 10) || 1, 1);

  const typeFilter = ALLOWED_TYPES.includes(type as EntityType)
    ? [type as EntityType]
    : undefined;

  const { results, suggestions } = term
    ? await searchCatalog(term, locale, { types: typeFilter }, PAGE_SIZE, (pageNumber - 1) * PAGE_SIZE)
    : { results: [], suggestions: [] };

  const tabs: { key: EntityType | undefined; label: string }[] = [
    { key: undefined, label: dict.search.all },
    { key: 'series', label: dict.nav.series },
    { key: 'movie', label: dict.nav.movies },
  ];

  return (
    <main className="mx-auto min-h-[70svh] w-full max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
      <header>
        <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-primary">
          <SearchIcon className="size-3.5" />
          {dict.search.title}
        </p>

        <h1 className="mt-4 text-display text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight">
          {term ? (
            <>
              {dict.search.resultsFor} <span className="text-primary">&ldquo;{term}&rdquo;</span>
            </>
          ) : (
            dict.search.promptTitle
          )}
        </h1>

        {term && (
          <p className="mt-3 text-sm text-muted-foreground">
            {results.length === 0
              ? dict.search.noResults
              : `${results.length}${results.length === PAGE_SIZE ? '+' : ''} ${dict.search.matches}`}
          </p>
        )}
      </header>

      {term && (
        <nav className="mt-8 flex flex-wrap gap-2" aria-label={dict.search.filterByType}>
          {tabs.map((tab) => {
            const isActive = tab.key === typeFilter?.[0];
            const query = new URLSearchParams({ q: term });
            if (tab.key) query.set('type', tab.key);

            return (
              <Link
                key={tab.label}
                href={`/${locale}/search?${query.toString()}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}

      {results.length > 0 && (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((row) => {
            const Icon = TYPE_ICON[row.entity_type] ?? Tv;
            return (
              <li key={`${row.entity_type}-${row.entity_id}`}>
                <Link href={resultHref(locale, row)} className="group block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted ring-1 ring-border transition-all duration-500 group-hover:ring-primary/45">
                    {row.poster_url ? (
                      <Image
                        src={row.poster_url}
                        alt={row.title}
                        fill
                        sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 16vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <Icon className="absolute inset-0 m-auto size-6 text-muted-foreground/60" />
                    )}
                  </div>

                  <h2 className="mt-3 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
                    {row.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{row.year ?? '—'}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {term && results.length === 0 && suggestions.length > 0 && (
        <section className="mt-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{dict.search.didYouMean}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={s}
                href={`/${locale}/search?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-primary/30 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
              >
                {s}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.length === PAGE_SIZE && term && (
        <div className="mt-16 flex justify-center gap-3">
          {pageNumber > 1 && (
            <Link
              href={`/${locale}/search?q=${encodeURIComponent(term)}&page=${pageNumber - 1}`}
              className="rounded-md border border-border px-5 py-2 text-sm transition-colors hover:border-primary/50"
            >
              {dict.search.previous}
            </Link>
          )}
          <Link
            href={`/${locale}/search?q=${encodeURIComponent(term)}&page=${pageNumber + 1}`}
            className="rounded-md border border-border px-5 py-2 text-sm transition-colors hover:border-primary/50"
          >
            {dict.search.next}
          </Link>
        </div>
      )}
    </main>
  );
}
