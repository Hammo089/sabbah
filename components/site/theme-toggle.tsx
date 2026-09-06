// components/site/theme-toggle.tsx
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        // `theme-toggle` is the hook film-mode uses to hide this: while a film
        // is the ground, the footage sets the brightness and a light palette
        // cannot be honoured.
        'theme-toggle inline-flex size-9 items-center justify-center rounded-md border border-border',
        'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
