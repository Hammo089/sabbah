// app/[lang]/layout.tsx
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { Archivo, Barlow_Condensed, Noto_Kufi_Arabic } from 'next/font/google';

import { i18n, isLocale, localeDirection, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata, SITE_URL } from '@/lib/seo/metadata';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

import '@/app/globals.css';

// sabbah.com sets everything in DIN, which is a commercial licence. Archivo is
// the closest free grotesque — same low-contrast, squarish counters — and
// Barlow Condensed matches DIN Condensed for display sizes. Swap both for the
// real DIN .woff2 files if the company licence covers web use.
const sans = Archivo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const condensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-condensed',
  display: 'swap',
});

// sabbah.com uses Droid Arabic Kufi. Noto Kufi Arabic is its direct successor
// from the same foundry — same skeleton, open licence.
const arabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const dynamicParams = false;

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);

  return {
    ...buildMetadata({
      lang,
      title: `${dict.meta.siteName} — ${dict.meta.tagline}`,
      description: dict.meta.description,
      siteName: dict.meta.siteName,
    }),
    title: {
      default: `${dict.meta.siteName} — ${dict.meta.tagline}`,
      template: `%s | ${dict.meta.siteName}`,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dir = localeDirection[locale];
  const dict = await getDictionary(locale);

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dict.meta.siteName,
    alternateName: 'Sabbah Brothers',
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: '1955',
    address: [
      { '@type': 'PostalAddress', addressLocality: 'Beirut', addressCountry: 'LB' },
      { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
      { '@type': 'PostalAddress', addressLocality: 'Casablanca', addressCountry: 'MA' },
      { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
    ],
    sameAs: [
      'https://www.youtube.com/@cedarsartproduction',
      'https://www.instagram.com/cedarsartproduction',
    ],
  };

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(sans.variable, display.variable, condensed.variable, arabic.variable)}
    >
      <body
        className={cn(
          'min-h-dvh bg-background font-sans text-foreground antialiased',
          'selection:bg-primary/25 selection:text-foreground',
          locale === 'ar' && 'font-arabic',
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="cap-theme"
        >
          {children}
        </ThemeProvider>

        <Script
          id="ld-organization"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
      </body>
    </html>
  );
}
