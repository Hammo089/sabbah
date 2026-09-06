'use client';

// components/admin/season-tabs.tsx — CLIENT COMPONENT
// The tab strip from the CAPDAMS Season Details layout. Each panel is passed in
// as a rendered server child, so the tabs stay a thin presentational shell and
// the heavy panels keep their server data-fetching.
import * as React from 'react';
import { cn } from '@/lib/utils';

export type TabKey =
  | 'summary' | 'details' | 'broadcast' | 'images' | 'posters' | 'gallery'
  | 'synopsis' | 'episodes' | 'watch' | 'cast' | 'crew' | 'website'
  | 'social' | 'tracking';

export type TabDef = { key: TabKey; label: string; badge?: number };

export function SeasonTabs({
  tabs,
  panels,
  storageKey,
}: {
  tabs: TabDef[];
  panels: Partial<Record<TabKey, React.ReactNode>>;
  /** Remembers the open tab per record, so a save does not throw you back to Summary. */
  storageKey?: string;
}) {
  const [active, setActive] = React.useState<TabKey>(tabs[0]?.key ?? 'summary');

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.sessionStorage.getItem(storageKey) as TabKey | null;
      if (saved && tabs.some((t) => t.key === saved)) setActive(saved);
    } catch {
      /* private mode — the default tab is fine */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function open(key: TabKey) {
    setActive(key);
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, key);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-px overflow-x-auto rounded-t-md bg-border [scrollbar-width:thin]"
      >
        {tabs.map((tab) => {
          const on = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => open(tab.key)}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                on
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
              {tab.badge ? (
                <span
                  className={cn(
                    'ms-2 rounded-full px-1.5 text-[0.65rem] tabular-nums',
                    on ? 'bg-black/20' : 'bg-muted-foreground/15',
                  )}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-b-md border border-t-0 border-border bg-card p-5 md:p-7">
        {panels[active] ?? (
          <p className="py-16 text-center text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}
