// app/[lang]/layout.tsx
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
const Inter=(_o:any)=>({variable:'--font-sans'});const Cormorant_Garamond=(_o:any)=>({variable:'--font-serif'});const Noto_Kufi_Arabic=(_o:any)=>({variable:'--font-arabic'});
import Script from 'next/script';

import { i18n, isLocale, localeDirection, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata, SITE_URL } from '@/lib/seo/metadata';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

import '@/app/globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

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
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
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
      className={cn(sans.variable, serif.variable, arabic.variable)}
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
