// components/site/media-card.tsx — SERVER COMPONENT
import Link from 'next/link';
import Image from 'next/image';
import { Tv, Film, Clapperboard, Sparkles } from 'lucide-react';
import type { CatalogCard } from '@/lib/queries/catalog';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

const KIND_ICON = { series: Tv, show: Clapperboard, movie: Film, animation: Sparkles } as const;

export function MediaCard({
  lang,
  item,
  labels,
  priority = false,
}: {
  lang: Locale;
  item: CatalogCard;
  labels: { new: string; comingSoon: string; seasons: string };
  priority?: boolean;
}) {
  const Icon = KIND_ICON[item.kind] ?? Tv;
  const base = item.kind === 'movie' ? 'movies' : 'series';

  return (
    <Link href={`/${lang}/${base}/${item.slug}`} className="group block">
      <div
        className={cn(
          'on-media relative aspect-[2/3] overflow-hidden rounded-md bg-muted',
          'ring-1 ring-white/[0.06] transition-all duration-500',
          'group-hover:ring-primary/45 group-hover:shadow-[0_18px_50px_-18px_rgba(44,132,92,0.5)]',
        )}
      >
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 16vw"
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <Icon className="absolute inset-0 m-auto size-6 text-muted-foreground/60" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {(item.isNew || item.isComingSoon) && (
          <span
            className={cn(
              'absolute top-2 start-2 rounded px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider',
              item.isComingSoon ? 'bg-black/80 text-primary' : 'bg-primary text-primary-foreground',
            )}
          >
            {item.isComingSoon ? labels.comingSoon : labels.new}
          </span>
        )}

        {item.seasons > 1 && (
          <span className="absolute bottom-2 end-2 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] text-white">
            S{item.seasons}
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
        {item.title}
      </h3>
      {item.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>}
      {item.year && <p className="mt-0.5 text-xs text-muted-foreground">{item.year}</p>}
    </Link>
  );
}
