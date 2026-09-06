// components/site/search/search-trigger.tsx
'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { SearchDialog } from './search-dialog';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

type Dict = React.ComponentProps<typeof SearchDialog>['dict'];

/**
 * Header search affordance. Owns the dialog state and the ⌘K / Ctrl-K binding.
 */
export function SearchTrigger({
  lang,
  dict,
  className,
  variant = 'bar',
}: {
  lang: Locale;
  dict: Dict;
  className?: string;
  variant?: 'bar' | 'icon';
}) {
  const [open, setOpen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // "/" is the classic search shortcut — but never while the user is typing.
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while the palette is open.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={dict.placeholder}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md border border-border',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <Search className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'group flex h-9 w-full max-w-xs items-center gap-2.5 rounded-md',
            'border border-border bg-muted/60 px-3 text-start',
            'transition-colors hover:border-primary/40 hover:bg-muted/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <Search className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          <span className="truncate text-xs text-muted-foreground">{dict.placeholder}</span>
          <kbd className="ms-auto hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-muted-foreground/70 sm:block">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
      )}

      <SearchDialog lang={lang} dict={dict} open={open} onOpenChange={setOpen} />
    </>
  );
}
