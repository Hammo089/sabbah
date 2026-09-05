// app/[lang]/admin/(dashboard)/series/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Tv } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FeaturedSliderSwitch } from '@/components/admin/featured-slider-switch';
import { StatusSelect } from '@/components/admin/status-select';
import { t, cn } from '@/lib/utils';
import type { ContentStatusEnum } from '@/types/database.types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function AdminSeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const { q, page } = await searchParams;
  const dict = await getDictionary(locale);

  const pageNumber = Math.max(Number.parseInt(page ?? '1', 10) || 1, 1);
  const from = (pageNumber - 1) * PAGE_SIZE;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('series')
    .select('id, slug, title, year, seasons_count, poster_url, status, is_featured_slider', {
      count: 'exact',
    })
    .order('sort_order', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (q?.trim()) query = query.ilike('slug', `%${q.trim()}%`);

  const { data, count } = await query;
  const rows = data ?? [];
  const total = count ?? 0;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl font-light">{dict.admin.series}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {dict.admin.totalTitles}
          </p>
        </div>

        <form className="w-full max-w-xs">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder={dict.admin.search}
            className={cn(
              'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
        </form>
      </header>

      {rows.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">{dict.admin.noResults}</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-start">
                <th className="w-16 p-3" />
                <th className="p-3 text-start font-medium">{dict.admin.series}</th>
                <th className="w-24 p-3 text-start font-medium">{dict.admin.seasons}</th>
                <th className="w-40 p-3 text-start font-medium">{dict.admin.status}</th>
                <th className="w-44 p-3 text-start font-medium">{dict.admin.featured}</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="relative h-14 w-10 overflow-hidden rounded bg-muted">
                      {row.poster_url ? (
                        <Image src={row.poster_url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <Tv className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <p className="font-medium">{t(row.title, locale, row.slug)}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{row.slug}</p>
                  </td>

                  <td className="p-3 text-muted-foreground">{row.seasons_count}</td>

                  <td className="p-3">
                    <StatusSelect
                      id={row.id}
                      table="series"
                      defaultValue={row.status as ContentStatusEnum}
                      labels={{
                        draft: dict.admin.draft,
                        in_review: dict.admin.inReview,
                        published: dict.admin.published,
                        archived: dict.admin.archived,
                      }}
                    />
                  </td>

                  <td className="p-3">
                    <FeaturedSliderSwitch
                      id={row.id}
                      table="series"
                      defaultChecked={row.is_featured_slider}
                      title={t(row.title, locale, row.slug)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav className="mt-8 flex justify-center gap-3">
          {pageNumber > 1 && (
            <a
              href={`?page=${pageNumber - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50"
            >
              ‹
            </a>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            {pageNumber} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          {from + PAGE_SIZE < total && (
            <a
              href={`?page=${pageNumber + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50"
            >
              ›
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
