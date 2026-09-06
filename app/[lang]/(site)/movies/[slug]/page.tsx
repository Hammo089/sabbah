// app/[lang]/(site)/movies/[slug]/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getTitleBySlug, getPublishedSlugsByKind } from '@/lib/queries/catalog';
import { TitleDetail } from '@/components/site/title-detail';

export const revalidate = 900;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugsByKind('movie');
  return slugs.slice(0, 200).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const [dict, title] = await Promise.all([getDictionary(lang), getTitleBySlug(slug, lang)]);
  if (!title) return {};

  return buildMetadata({
    lang,
    title: title.title,
    description: title.synopsis.slice(0, 160) || dict.meta.description,
    siteName: dict.meta.siteName,
    path: `movies/${slug}`,
    image: title.backdropUrl ?? title.posterUrl ?? undefined,
    type: 'video.movie',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  return <TitleDetail lang={lang} slug={slug} basePath="movies" />;
}
