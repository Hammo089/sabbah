// app/[lang]/(site)/about/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';
import { Reveal } from '@/components/motion/reveal';

export const revalidate = 3600;

const MILESTONES = [
  { year: '1954', key: 'founded' },
  { year: '2000', key: 'postproduction' },
  { year: '2010', key: 'cairo' },
  { year: '2018', key: 'casablanca' },
  { year: '2021', key: 'dubai' },
  { year: '2022', key: 'riyadh' },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.pages.aboutTitle,
    description: dict.pages.aboutLead,
    siteName: dict.meta.siteName,
    path: 'about',
  });
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <PageShell eyebrow={dict.nav.company} title={dict.pages.aboutTitle} lead={dict.pages.aboutLead}>
      <ol className="mt-20 space-y-0">
        {MILESTONES.map((m, i) => (
          <Reveal key={m.year} as="li" delay={i * 0.05}>
            <div className="grid grid-cols-[auto_1fr] gap-6 border-t border-border py-8">
              <span className="text-display text-2xl font-light text-primary md:text-3xl">{m.year}</span>
              <p className="text-[0.95rem] leading-relaxed text-foreground/80">
                {dict.milestones[m.key]}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>

      <section className="mt-20 border-t border-border pt-10">
        <p className="text-[0.65rem] uppercase tracking-[0.24em] text-primary">{dict.pages.offices}</p>
        <p className="mt-4 text-lg text-foreground/80">{dict.hero.offices}</p>
      </section>
    </PageShell>
  );
}
