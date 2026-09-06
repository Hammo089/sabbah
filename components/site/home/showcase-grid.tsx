// components/site/home/showcase-grid.tsx — SERVER COMPONENT
import Link from 'next/link';
import Image from 'next/image';
import type { CatalogCard } from '@/lib/queries/catalog';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

/** Editorial mosaic: the first card spans two rows, the rest are 2:3 tiles. */
export function ShowcaseGrid({
  lang,
  items,
  labels,
}: {
  lang: Locale;
  items: CatalogCard[];
  labels: { new: string; comingSoon: string };
}) {
  if (items.length === 0) return null;

  return (
    <div className="on-media grid grid-cols-2 gap-0.5 md:grid-cols-4">
      {items.map((item, i) => {
        const big = i === 0;

        return (
          <Link
            key={item.id}
            href={`/${lang}/series/${item.slug}`}
            className={cn(
              'group relative overflow-hidden bg-[#1a1a1a]',
              big ? 'row-span-2 aspect-[3/4] md:aspect-auto' : 'aspect-[2/3]',
            )}
          >
            {item.posterUrl && (
              <Image
                src={item.posterUrl}
                alt={item.title}
                fill
                sizes={big ? '(max-width:768px) 50vw, 25vw' : '(max-width:768px) 50vw, 25vw'}
                priority={i < 4}
                className="object-cover transition-transform [transition-duration:600ms] [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]"
              />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.97)_28%,rgba(0,0,0,.1)_65%,transparent)]" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-[linear-gradient(to_bottom,rgba(0,0,0,.55),transparent)] p-4">
              {(item.isNew || item.isComingSoon) && (
                <span className="condensed bg-primary px-2 py-0.5 text-[10px] tracking-[0.2em] text-primary-foreground">
                  {item.isComingSoon ? labels.comingSoon : labels.new}
                </span>
              )}
              {item.seasons > 1 && (
                <span className="condensed ms-auto text-[11px] tracking-[0.2em] text-muted-foreground">
                  S{item.seasons}
                </span>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 translate-y-1.5 p-5 opacity-85 transition-transform [transition-duration:350ms] group-hover:translate-y-0 group-hover:opacity-100">
              <h3
                className={cn(
                  'display-title text-white',
                  big ? 'text-[30px]' : 'text-[19px]',
                )}
              >
                {item.title}
              </h3>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {item.year ?? ''}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
