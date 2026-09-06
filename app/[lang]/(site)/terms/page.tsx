// app/[lang]/(site)/terms/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';
import { LegalDoc } from '@/components/site/legal-doc';

export const revalidate = 86400;
const UPDATED_ON = '2026-01-01';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.legal.termsTitle,
    description: dict.meta.description,
    siteName: dict.meta.siteName,
    path: 'terms',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <PageShell eyebrow={dict.meta.siteName} title={dict.legal.termsTitle}>
      <LegalDoc
        sections={dict.legal.termsBody}
        updatedLabel={dict.legal.updated}
        updatedOn={UPDATED_ON}
      />
    </PageShell>
  );
}
