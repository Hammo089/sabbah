// app/[lang]/(site)/services/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.pages.servicesTitle,
    description: dict.meta.description,
    siteName: dict.meta.siteName,
    path: 'services',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <PageShell eyebrow={dict.nav.company} title={dict.pages.servicesTitle}>
      <p className="mt-12 text-sm text-neutral-500">{dict.pages.comingSoonPage}</p>
    </PageShell>
  );
}
