// components/site/search/search-dialog.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, X, Loader2, CornerDownLeft, ArrowUp, ArrowDown, Film, Tv, Clapperboard } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { localeDirection, type Locale } from '@/i18n/config';
import type { SearchResultRow } from '@/types/database.types';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'cap:recent-searches';
const MAX_RECENT = 6;
const MIN_LEN = 2;

const TYPE_ICON = {
  series: Tv,
  movie: Film,
  program: Clapperboard,
} as const;

type Dict = {
  placeholder: string;
  empty: string;
  didYouMean: string;
  recent: string;
  seeAll: string;
  navigate: string;
  select: string;
  close: string;
  hint: string;
};

function href(lang: Locale, row: SearchResultRow) {
  const seg = row.entity_type === 'movie' ? 'movies' : row.entity_type === 'program' ? 'programs' : 'series';
  return `/${lang}/${seg}/${row.slug}`;
}

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter((t) => t !== term)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode — recent searches are a convenience, never load-bearing */
  }
}

export function SearchDialog({
  lang,
  dict,
  open,
  onOpenChange,
}: {
  lang: Locale;
  dict: Dict;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const isRtl = localeDirection[lang] === 'rtl';

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResultRow[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query, 200);

  // Load recents when the dialog opens; reset transient state when it closes.
  React.useEffect(() => {
    if (open) {
      setRecent(readRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setResults([]);
      setSuggestions([]);
      setActive(0);
    }
  }, [open]);

  // Fetch — aborts the in-flight request whenever the term changes.
  React.useEffect(() => {
    const term = debounced.trim();

    if (term.length < MIN_LEN) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}&limit=8`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { results: [], suggestions: [] }))
      .then((data: { results?: SearchResultRow[]; suggestions?: string[] }) => {
        setResults(data.results ?? []);
        setSuggestions(data.suggestions ?? []);
        setActive(0);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') {
          setResults([]);
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced, lang]);

  const go = React.useCallback(
    (row: SearchResultRow) => {
      pushRecent(query.trim());
      onOpenChange(false);
      router.push(href(lang, row));
    },
    [lang, onOpenChange, query, router],
  );

  const goToAll = React.useCallback(() => {
    const term = query.trim();
    if (term.length < MIN_LEN) return;
    pushRecent(term);
    onOpenChange(false);
    router.push(`/${lang}/search?q=${encodeURIComponent(term)}`);
  }, [lang, onOpenChange, query, router]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onOpenChange(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + delta + results.length) % results.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const row = results[active];
      if (row) go(row);
      else goToAll();
    }
  }

  // Keep the highlighted row in view during keyboard navigation.
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const showRecent = query.trim().length < MIN_LEN && recent.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      <motion.div
        key="panel"
        role="dialog"
        aria-modal="true"
        aria-label={dict.placeholder}
        dir={isRtl ? 'rtl' : 'ltr'}
        initial={reduce ? false : { opacity: 0, y: -12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onKeyDown={onKeyDown}
        className={cn(
          'fixed inset-x-4 top-[12vh] z-[101] mx-auto max-w-2xl overflow-hidden rounded-xl',
          'border border-primary/20 bg-[#0d0d0e] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]',
        )}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="search-results"
            className={cn(
              'h-14 w-full bg-transparent text-[0.98rem] text-foreground',
              'outline-none placeholder:text-muted-foreground/70',
            )}
          />

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={dict.close}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground/90"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} id="search-results" role="listbox" className="max-h-[52vh] overflow-y-auto overscroll-contain">
          {showRecent && (
            <div className="p-2">
              <p className="px-3 py-2 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/70">
                {dict.recent}
              </p>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Search className="size-3.5 shrink-0 text-muted-foreground/70" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {!showRecent && results.length > 0 && (
            <div className="p-2">
              {results.map((row, i) => {
                const Icon = TYPE_ICON[row.entity_type] ?? Tv;
                return (
                  <button
                    key={`${row.entity_type}-${row.entity_id}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(row)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md p-2 text-start transition-colors',
                      i === active ? 'bg-primary/10' : 'hover:bg-muted/60',
                    )}
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted ring-1 ring-border">
                      {row.poster_url ? (
                        <Image src={row.poster_url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <Icon className="absolute inset-0 m-auto size-4 text-muted-foreground/60" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                        <Icon className="size-3" />
                        {row.year ?? '—'}
                        {row.genres.length > 0 && <span className="truncate">· {row.genres.slice(0, 2).join(', ')}</span>}
                      </p>
                    </div>

                    {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-primary rtl:rotate-90" />}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={goToAll}
                className="mt-1 w-full rounded-md px-3 py-2.5 text-center text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/10"
              >
                {dict.seeAll}
              </button>
            </div>
          )}

          {!showRecent && !loading && query.trim().length >= MIN_LEN && results.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">{dict.empty}</p>

              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground/70">{dict.didYouMean}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!showRecent && query.trim().length < MIN_LEN && recent.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground/70">{dict.hint}</p>
          )}
        </div>

        {/* Footer legend */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[0.65rem] text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <ArrowUp className="size-3" />
            <ArrowDown className="size-3" />
            {dict.navigate}
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="size-3" />
            {dict.select}
          </span>
          <span className="ms-auto font-mono">ESC</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
