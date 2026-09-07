// app/[lang]/(site)/press/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';
import { getPressItems } from '@/lib/queries/pages';
import { Reveal } from '@/components/motion/reveal';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.pages.pressTitle,
    description: dict.pages.pressLead,
    siteName: dict.meta.siteName,
    path: 'press',
  });
}

/** Locale-correct date; an unparseable value degrades to the raw string. */
function formatDate(value: string | null, locale: Locale): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, items] = await Promise.all([getDictionary(locale), getPressItems(locale)]);

  return (
    <PageShell eyebrow={dict.nav.company} title={dict.pages.pressTitle} lead={dict.pages.pressLead}>
      {items.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">{dict.pages.pressEmpty}</p>
      ) : (
        <ul className="mt-14 divide-y divide-border/70 border-y border-border/70">
          {items.map((item, i) => {
            // An item with no external link is still a record worth showing —
            // it renders as a static row rather than a dead anchor.
            const Wrapper = item.externalUrl ? 'a' : 'div';
            const linkProps = item.externalUrl
              ? { href: item.externalUrl, target: '_blank' as const, rel: 'noreferrer' }
              : {};

            return (
              <li key={item.id}>
                <Reveal delay={Math.min(i, 6) * 0.05} amount={0.15}>
                  <Wrapper
                    {...linkProps}
                    className="group flex flex-col gap-5 py-8 transition-colors sm:flex-row sm:items-start sm:gap-8"
                  >
                    {item.coverUrl && (
                      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-md ring-1 ring-border sm:w-56">
                        <Image
                          src={item.coverUrl}
                          alt=""
                          fill
                          sizes="224px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/70">
                        {item.outlet && <span className="text-primary/90">{item.outlet}</span>}
                        {formatDate(item.publishedOn, locale) && (
                          <span>{formatDate(item.publishedOn, locale)}</span>
                        )}
                      </div>

                      <h2 className="mt-2.5 text-lg font-light leading-snug text-foreground transition-colors group-hover:text-primary md:text-xl">
                        {item.title}
                      </h2>

                      {item.excerpt && (
                        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {item.excerpt}
                        </p>
                      )}

                      {item.externalUrl && (
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-primary">
                          {dict.pages.pressRead}
                          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      )}
                    </div>
                  </Wrapper>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
