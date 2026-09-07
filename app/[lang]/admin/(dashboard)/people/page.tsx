// app/[lang]/admin/(dashboard)/people/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, User } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { localizedSearchFilter } from '@/lib/admin/search';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminPeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const { q } = await searchParams;
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('people')
    .select('id, slug, name, photo_url, is_published', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100);

  // Search the slug AND every language of the jsonb column: an operator
  // types the title they know, not the transliterated slug.
  const filter = q ? localizedSearchFilter(q, 'name') : null;
  if (filter) query = query.or(filter);

  const { data, count } = await query;
  const rows = data ?? [];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl font-light">{dict.admin.people}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{count ?? 0}</p>
        </div>

        <div className="flex items-center gap-3">
          <form>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder={dict.admin.search}
              className="h-9 w-48 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>

          <Button asChild variant="gold" size="sm">
            <Link href={`/${locale}/admin/people/new`}>
              <Plus />
              {dict.admin.addPerson}
            </Link>
          </Button>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">{dict.admin.noResults}</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/${locale}/admin/people/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <User className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t(p.name, locale, p.slug)}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{p.slug}</p>
                </div>
                {!p.is_published && (
                  <span className="ms-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
                    {dict.admin.draft}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
