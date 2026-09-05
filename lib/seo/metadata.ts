// lib/seo/metadata.ts
import type { Metadata } from 'next';
import { i18n, openGraphLocale, type Locale } from '@/i18n/config';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://sabbah.com';

/** Builds hreflang alternates for every locale for a given path. */
export function buildLanguageAlternates(path = '') {
  const clean = path.replace(/^\//, '');
  return Object.fromEntries(
    i18n.locales.map((l) => [l, `${SITE_URL}/${l}${clean ? `/${clean}` : ''}`]),
  ) as Record<Locale, string>;
}

type SeoInput = {
  lang: Locale;
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'video.tv_show' | 'video.movie';
  siteName: string;
  noIndex?: boolean;
};

export function buildMetadata({
  lang,
  title,
  description,
  path = '',
  image,
  type = 'website',
  siteName,
  noIndex = false,
}: SeoInput): Metadata {
  const canonical = `${SITE_URL}/${lang}${path ? `/${path.replace(/^\//, '')}` : ''}`;
  const ogImage = image ?? `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&lang=${lang}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: siteName,
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-video-preview': -1 },
    alternates: {
      canonical,
      languages: { ...buildLanguageAlternates(path), 'x-default': `${SITE_URL}/${i18n.defaultLocale}` },
    },
    openGraph: {
      type: type as 'website',
      url: canonical,
      title,
      description,
      siteName,
      locale: openGraphLocale[lang],
      alternateLocale: i18n.locales.filter((l) => l !== lang).map((l) => openGraphLocale[l]),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  };
}
