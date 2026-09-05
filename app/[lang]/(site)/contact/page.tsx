// app/[lang]/(site)/contact/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, MapPin } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';

export const revalidate = 3600;

const OFFICES = [
  { city: 'Beirut', country: 'Lebanon' },
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Casablanca', country: 'Morocco' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Riyadh', country: 'Saudi Arabia' },
];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.pages.contactTitle,
    description: dict.pages.contactLead,
    siteName: dict.meta.siteName,
    path: 'contact',
  });
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <PageShell eyebrow={dict.nav.contact} title={dict.pages.contactTitle} lead={dict.pages.contactLead}>
      <div className="mt-16 grid gap-12 md:grid-cols-2">
        <section>
          <p className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-primary">
            <Mail className="size-3.5" />
            {dict.pages.email}
          </p>
          <a
            href="mailto:info@sabbah.com"
            dir="ltr"
            className="mt-3 inline-block text-lg text-neutral-200 transition-colors hover:text-primary"
          >
            info@sabbah.com
          </a>
        </section>

        <section>
          <p className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-primary">
            <MapPin className="size-3.5" />
            {dict.pages.offices}
          </p>
          <ul className="mt-3 space-y-1.5">
            {OFFICES.map((o) => (
              <li key={o.city} className="text-sm text-neutral-300">
                {o.city}
                <span className="text-neutral-600"> — {o.country}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
