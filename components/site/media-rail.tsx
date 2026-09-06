// components/site/media-rail.tsx — SERVER COMPONENT
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MediaCard } from './media-card';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import type { CatalogCard } from '@/lib/queries/catalog';
import type { Locale } from '@/i18n/config';

export function MediaRail({
  lang,
  title,
  items,
  href,
  labels,
}: {
  lang: Locale;
  title: string;
  items: CatalogCard[];
  href?: string;
  labels: { new: string; comingSoon: string; seasons: string; viewAll: string };
}) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 py-10 md:px-10 xl:px-16">
      <Reveal as="header" className="flex items-baseline justify-between gap-4">
        <h2 className="text-display text-xl font-light md:text-2xl">{title}</h2>
        {href && (
          <Link
            href={href}
            className="group flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-primary"
          >
            {labels.viewAll}
            <ChevronLeft className="size-3 transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" />
          </Link>
        )}
      </Reveal>

      <RevealGroup className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {items.map((item, i) => (
          <RevealItem key={item.id} className="w-[42vw] shrink-0 snap-start sm:w-[28vw] lg:w-[15vw] xl:w-[12vw]">
            <MediaCard lang={lang} item={item} labels={labels} priority={i < 3} />
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
