// app/[lang]/(site)/partners/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPartners } from '@/lib/queries/catalog';
import { PageShell } from '@/components/site/page-shell';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.partners.title,
    description: dict.partners.lead,
    siteName: dict.meta.siteName,
    path: 'partners',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, partners] = await Promise.all([getDictionary(locale), getPartners()]);

  return (
    <PageShell eyebrow={dict.nav.company} title={dict.partners.title} lead={dict.partners.lead}>
      {partners.length === 0 ? (
        <p className="mt-14 text-sm text-muted-foreground">{dict.partners.empty}</p>
      ) : (
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <Link
              key={p.id}
              href={`/${locale}/partners/${p.slug}`}
              className="group flex min-h-[190px] flex-col justify-between bg-background p-7 transition-colors hover:bg-muted/40"
            >
              <div className="flex h-14 items-center">
                {p.logoUrl ? (
                  <Image
                    src={p.logoUrl}
                    alt={p.name}
                    width={140}
                    height={48}
                    className="h-10 w-auto opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="text-display text-lg font-light">{p.name}</span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {p.titleCount} {dict.partners.titles}
                  <ArrowUpRight className="size-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
