// components/site/title-tabs.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Locale } from '@/i18n/config';
import type { TitleDetail } from '@/lib/queries/catalog';
import { cn } from '@/lib/utils';

type Dict = {
  about: string; episodes: string; cast: string; posters: string;
  synopsis: string; noEpisodes: string; noCast: string; noPosters: string;
  asCharacter: string;
};

type Tab = 'about' | 'episodes' | 'cast' | 'posters';

export function TitleTabs({
  lang,
  title,
  dict,
}: {
  lang: Locale;
  title: NonNullable<TitleDetail>;
  dict: Dict;
}) {
  const [tab, setTab] = React.useState<Tab>('about');

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'about', label: dict.about },
    { key: 'episodes', label: dict.episodes, count: title.episodes.length },
    { key: 'cast', label: dict.cast, count: title.cast.length + title.crew.length },
    { key: 'posters', label: dict.posters, count: title.media.length },
  ];

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-24 md:px-10 xl:px-16">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'relative shrink-0 px-5 py-3 text-xs uppercase tracking-[0.16em] transition-colors',
              tab === t.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {t.label}
            {t.count ? <span className="ms-1.5 text-[0.65rem] text-muted-foreground/70">{t.count}</span> : null}
            {tab === t.key && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-0 -bottom-px h-px bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pt-10"
        >
          {tab === 'about' && (
            <p className="max-w-3xl text-[0.95rem] leading-relaxed text-foreground/80">
              {title.synopsis || '—'}
            </p>
          )}

          {tab === 'episodes' &&
            (title.episodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.noEpisodes}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {title.episodes.map((ep) => (
                  <li
                    key={ep.id}
                    className="flex gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-muted">
                      {ep.thumbnailUrl && (
                        <Image src={ep.thumbnailUrl} alt="" fill sizes="112px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-primary">
                        S{ep.season} · E{ep.number}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{ep.title}</p>
                      {ep.duration && (
                        <p className="mt-1 text-xs text-muted-foreground/70">{Math.round(ep.duration / 60)} min</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'cast' &&
            (title.cast.length + title.crew.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.noCast}</p>
            ) : (
              <div className="space-y-12">
                {title.cast.length > 0 && (
                  <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
                    {title.cast.map((c) => (
                      <li key={c.id}>
                        <Link href={`/${lang}/people/${c.personSlug}`} className="group block text-center">
                          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-muted ring-1 ring-border transition-all group-hover:ring-primary/50">
                            {c.photoUrl && (
                              <Image src={c.photoUrl} alt={c.name} fill sizes="140px" className="object-cover" />
                            )}
                          </div>
                          <p className="mt-3 text-sm font-medium text-foreground/90 transition-colors group-hover:text-primary">
                            {c.name}
                          </p>
                          {c.character && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {dict.asCharacter} {c.character}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {title.crew.length > 0 && (
                  <ul className="flex flex-wrap gap-x-10 gap-y-4">
                    {title.crew.map((c) => (
                      <li key={c.id}>
                        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/70">{c.role}</p>
                        <Link
                          href={`/${lang}/people/${c.personSlug}`}
                          className="text-sm text-foreground/90 transition-colors hover:text-primary"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

          {tab === 'posters' &&
            (title.media.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.noPosters}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {title.media.map((m) => (
                  <li key={m.id} className="relative aspect-video overflow-hidden rounded-md bg-muted">
                    <Image src={m.url} alt={m.caption} fill sizes="(max-width:768px) 45vw, 24vw" className="object-cover" />
                  </li>
                ))}
              </ul>
            ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
