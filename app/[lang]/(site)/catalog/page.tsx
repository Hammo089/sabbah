// app/[lang]/(site)/catalog/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getCatalog, type CatalogFilters } from '@/lib/queries/catalog';
import { MediaCard } from '@/components/site/media-card';
import { cn } from '@/lib/utils';
import type { TitleKind, RegionCode } from '@/types/database.types';

export const revalidate = 900;

const KINDS: TitleKind[] = ['series', 'show', 'movie', 'animation'];
const REGIONS: RegionCode[] = ['levant', 'egypt', 'arabia', 'maghreb'];
const PAGE_SIZE = 48;

type SP = Promise<{ kind?: string; region?: string; genre?: string; year?: string; page?: string }>;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.catalog.title,
    description: dict.catalog.description,
    siteName: dict.meta.siteName,
    path: 'catalog',
  });
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: SP;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const sp = await searchParams;
  const dict = await getDictionary(locale);

  const pageNumber = Math.max(Number.parseInt(sp.page ?? '1', 10) || 1, 1);
  const filters: CatalogFilters = {
    kind: KINDS.includes(sp.kind as TitleKind) ? (sp.kind as TitleKind) : undefined,
    region: REGIONS.includes(sp.region as RegionCode) ? (sp.region as RegionCode) : undefined,
    genre: sp.genre || undefined,
    year: sp.year ? Number.parseInt(sp.year, 10) || undefined : undefined,
  };

  const { items, total } = await getCatalog(locale, filters, PAGE_SIZE, (pageNumber - 1) * PAGE_SIZE);

  const labels = { new: dict.catalog.new, comingSoon: dict.catalog.comingSoon, seasons: dict.catalog.seasons };

  const build = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { kind: sp.kind, region: sp.region, genre: sp.genre, year: sp.year, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return `/${locale}/catalog${s ? `?${s}` : ''}`;
  };

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors',
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-white/12 text-neutral-400 hover:border-primary/50 hover:text-neutral-100',
    );

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-16 md:px-10 md:py-24 xl:px-16">
      <header>
        <h1 className="text-display text-[clamp(2rem,4vw,3.2rem)] font-light">{dict.catalog.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400">{dict.catalog.description}</p>
      </header>

      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-[0.65rem] uppercase tracking-[0.2em] text-neutral-600">
            {dict.catalog.kind}
          </span>
          <Link href={build({ kind: undefined })} className={chip(!filters.kind)}>
            {dict.catalog.all}
          </Link>
          {KINDS.map((k) => (
            <Link key={k} href={build({ kind: k })} className={chip(filters.kind === k)}>
              {dict.catalog[k]}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-[0.65rem] uppercase tracking-[0.2em] text-neutral-600">
            {dict.catalog.region}
          </span>
          <Link href={build({ region: undefined })} className={chip(!filters.region)}>
            {dict.catalog.all}
          </Link>
          {REGIONS.map((r) => (
            <Link key={r} href={build({ region: r })} className={chip(filters.region === r)}>
              {dict.catalog[r]}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-neutral-500">
        {total} {dict.catalog.results}
      </p>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-neutral-500">{dict.catalog.empty}</p>
          <Link href={`/${locale}/catalog`} className="mt-4 inline-block text-sm text-primary hover:underline">
            {dict.catalog.clear}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item, i) => (
            <li key={item.id}>
              <MediaCard lang={locale} item={item} labels={labels} priority={i < 6} />
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <nav className="mt-16 flex justify-center gap-3">
          {pageNumber > 1 && (
            <Link href={`${build({})}${build({}).includes('?') ? '&' : '?'}page=${pageNumber - 1}`} className="rounded-md border border-white/12 px-5 py-2 text-sm hover:border-primary/50">
              ‹
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-neutral-500">
            {pageNumber} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          {pageNumber * PAGE_SIZE < total && (
            <Link href={`${build({})}${build({}).includes('?') ? '&' : '?'}page=${pageNumber + 1}`} className="rounded-md border border-white/12 px-5 py-2 text-sm hover:border-primary/50">
              ›
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
