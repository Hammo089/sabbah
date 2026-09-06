// app/[lang]/(site)/b2b/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, Truck, Globe2, ArrowUpRight } from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getCatalog, getAllBroadcasters } from '@/lib/queries/catalog';
import { MediaCard } from '@/components/site/media-card';
import { B2BGate } from '@/components/site/b2b-gate';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.b2b.title,
    description: dict.b2b.lead,
    siteName: dict.meta.siteName,
    path: 'b2b',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, catalogPage, broadcasters] = await Promise.all([
    getDictionary(locale),
    getCatalog(locale, {}, 18),
    getAllBroadcasters(),
  ]);

  const catalog = catalogPage.items;

  const cardLabels = {
    new: dict.catalog.new,
    comingSoon: dict.catalog.comingSoon,
    seasons: dict.catalog.seasons,
  };

  const pitches = [
    { icon: ShieldCheck, title: dict.b2b.pitch1Title, body: dict.b2b.pitch1Body },
    { icon: Truck, title: dict.b2b.pitch2Title, body: dict.b2b.pitch2Body },
    { icon: Globe2, title: dict.b2b.pitch3Title, body: dict.b2b.pitch3Body },
  ];

  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]
                     [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]
                     [background-size:64px_64px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 end-[-10%] h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
          <p className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-primary">
            <span className="inline-block h-px w-8 bg-primary/70" />
            {dict.b2b.eyebrow}
          </p>

          <h1 className="mt-5 max-w-3xl text-display text-[clamp(2.2rem,6vw,4.2rem)] font-light leading-[1.05] text-foreground">
            {dict.b2b.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{dict.b2b.lead}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <B2BGate
              lang={locale}
              dict={{
                download: dict.b2b.downloadPdf,
                title: dict.b2b.gateTitle,
                lead: dict.b2b.gateLead,
                fullName: dict.b2b.gateName,
                company: dict.b2b.gateCompany,
                position: dict.b2b.gatePosition,
                phone: dict.b2b.gatePhone,
                email: dict.b2b.gateEmail,
                interest: dict.b2b.gateInterest,
                submit: dict.b2b.gateSubmit,
                cancel: dict.b2b.gateCancel,
                error: dict.b2b.gateError,
                note: dict.b2b.gateNote,
              }}
            />
            <Button asChild variant="outline">
              <Link href={`/${locale}/contact`}>
                {dict.b2b.ctaButton}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Value props ────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10">
        <RevealGroup className="grid gap-px overflow-hidden rounded-lg bg-border md:grid-cols-3">
          {pitches.map(({ icon: Icon, title, body }) => (
            <RevealItem key={title} as="article" className="group bg-background p-8 transition-colors hover:bg-muted/40">
              <Icon className="size-6 text-primary" />
              <h2 className="mt-5 text-display text-lg font-light text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ── Library ────────────────────────────────────────────────────── */}
      {catalog.length > 0 && (
        <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 md:px-10 xl:px-16">
          <header className="flex items-baseline justify-between gap-4">
            <h2 className="text-display text-xl font-light md:text-2xl">{dict.b2b.libraryTitle}</h2>
            <Link
              href={`/${locale}/catalog`}
              className="text-xs uppercase tracking-[0.16em] text-primary hover:underline"
            >
              {dict.common.viewAll}
            </Link>
          </header>

          <RevealGroup className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {catalog.map((item) => (
              <RevealItem key={item.id}>
                <MediaCard lang={locale} item={item} labels={cardLabels} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* ── Partners ───────────────────────────────────────────────────── */}
      {broadcasters.length > 0 && (
        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-10">
            <p className="text-center text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/70">
              {dict.b2b.partnersTitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {broadcasters.map((b) =>
                b.logo_url ? (
                  <Image
                    key={b.id}
                    src={b.logo_url}
                    alt={b.name}
                    width={120}
                    height={40}
                    className="h-9 w-auto opacity-45 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                  />
                ) : (
                  <span key={b.id} className="text-sm text-muted-foreground">
                    {b.name}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-24 md:px-10">
        <Reveal className="rounded-lg border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-10 md:p-14">
          <h2 className="text-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-light text-foreground">
            {dict.b2b.ctaTitle}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{dict.b2b.ctaBody}</p>
          <Button asChild variant="gold" className="mt-8">
            <Link href={`/${locale}/contact`}>
              {dict.b2b.ctaButton}
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
