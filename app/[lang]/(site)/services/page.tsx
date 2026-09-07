// app/[lang]/(site)/services/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Lightbulb, Clapperboard, SlidersHorizontal, Languages, Globe, Archive, Film,
  type LucideIcon,
} from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';
import { getServices } from '@/lib/queries/pages';
import { Reveal } from '@/components/motion/reveal';

export const revalidate = 3600;

/**
 * Icons are stored as names in the database, so an editor can pick one without
 * a deploy — but they resolve against this fixed map rather than a dynamic
 * import, so an unknown or hostile value can only ever fall back to `Film`.
 */
const ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  clapperboard: Clapperboard,
  'sliders-horizontal': SlidersHorizontal,
  languages: Languages,
  globe: Globe,
  archive: Archive,
  film: Film,
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.pages.servicesTitle,
    description: dict.pages.servicesLead,
    siteName: dict.meta.siteName,
    path: 'services',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, services] = await Promise.all([getDictionary(locale), getServices(locale)]);

  return (
    <PageShell
      eyebrow={dict.nav.company}
      title={dict.pages.servicesTitle}
      lead={dict.pages.servicesLead}
    >
      {services.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">{dict.pages.comingSoonPage}</p>
      ) : (
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = ICONS[service.icon ?? ''] ?? Film;

            return (
              <Reveal key={service.id} delay={Math.min(i, 6) * 0.06} amount={0.15}>
                {/* Each cell paints its own background so the 1px grid gap
                    reads as a rule between panels, not as a gutter. */}
                <article className="group relative h-full bg-background p-8 transition-colors hover:bg-muted/25">
                  <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100" />

                  <Icon
                    className="size-6 text-primary/80 transition-transform duration-500 group-hover:scale-110"
                    strokeWidth={1.4}
                  />

                  <h2 className="mt-6 text-base font-medium text-foreground">{service.title}</h2>

                  {service.summary && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {service.summary}
                    </p>
                  )}

                  <span className="mt-7 block text-[0.6rem] tabular-nums tracking-[0.2em] text-muted-foreground/40">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
