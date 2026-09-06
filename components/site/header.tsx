// components/site/header.tsx — SERVER COMPONENT (client bits are leaves)
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { SearchTrigger } from '@/components/site/search/search-trigger';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LocaleSwitcher } from '@/components/site/locale-switcher';
import { MobileNav } from '@/components/site/nav/mobile-nav';
import { HeaderShell } from '@/components/site/nav/header-shell';

export type NavItem = { href: string; label: string };

export function buildNav(lang: Locale, dict: Dictionary): NavItem[] {
  return [
    { href: `/${lang}/catalog`, label: dict.nav.series },
    { href: `/${lang}/scripts`, label: dict.nav.scripts },
    { href: `/${lang}/about`, label: dict.nav.company },
    { href: `/${lang}/services`, label: dict.nav.services },
    { href: `/${lang}/partners`, label: dict.nav.partners },
    { href: `/${lang}/press`, label: dict.nav.news },
    { href: `/${lang}/contact`, label: dict.nav.contact },
    { href: `/${lang}/submit`, label: dict.nav.submit },
  ];
}

export function SiteHeader({
  lang,
  dict,
  headerStyle = 'transparent',
  glass = false,
}: {
  lang: Locale;
  dict: Dictionary;
  headerStyle?: 'transparent' | 'solid';
  glass?: boolean;
}) {
  const nav = buildNav(lang, dict);

  return (
    <HeaderShell alwaysSolid={headerStyle === 'solid'} glass={glass}>
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-6 px-6 md:px-10 xl:px-16">
        <Link href={`/${lang}`} className="flex shrink-0 items-baseline gap-2">
          <span className="text-display text-lg font-semibold text-primary">CAP</span>
          <span className="hidden text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground lg:block">
            {dict.meta.siteName}
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchTrigger lang={lang} dict={dict.search} className="hidden md:flex" />
          <SearchTrigger lang={lang} dict={dict.search} variant="icon" className="md:hidden" />
          <LocaleSwitcher currentLocale={lang} />
          <ThemeToggle />
          <MobileNav items={nav} label={dict.nav.menu} />
        </div>
      </div>
    </HeaderShell>
  );
}
