// components/site/locale-switcher.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { i18n, localeNames, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/') || `/${next}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
      {i18n.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          aria-current={locale === currentLocale ? 'true' : undefined}
          title={localeNames[locale]}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium uppercase transition-colors',
            locale === currentLocale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
