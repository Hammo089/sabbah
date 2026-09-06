// components/site/footer.tsx — SERVER COMPONENT
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { cn } from '@/lib/utils';

export function SiteFooter({
  lang,
  dict,
  glass = false,
}: {
  lang: Locale;
  dict: Dictionary;
  glass?: boolean;
}) {
  const columns = [
    {
      title: dict.nav.catalog,
      links: [
        { href: `/${lang}/catalog`, label: dict.nav.series },
        { href: `/${lang}/catalog?kind=movie`, label: dict.nav.movies },
        { href: `/${lang}/scripts`, label: dict.nav.scripts },
      ],
    },
    {
      title: dict.nav.company,
      links: [
        { href: `/${lang}/about`, label: dict.footer.about },
        { href: `/${lang}/about/team`, label: dict.footer.team },
        { href: `/${lang}/legacy`, label: dict.nav.legacy },
        { href: `/${lang}/services`, label: dict.nav.services },
      ],
    },
    {
      title: dict.footer.connect,
      links: [
        { href: `/${lang}/press`, label: dict.nav.news },
        { href: `/${lang}/contact`, label: dict.nav.contact },
        { href: `/${lang}/b2b`, label: dict.nav.b2b },
        { href: `/${lang}/partners`, label: dict.nav.partners },
        { href: `/${lang}/submit`, label: dict.nav.submit },
      ],
    },
  ];

  return (
    <footer className={cn('border-t', glass ? 'glass-bar' : 'border-border bg-background')}>
      <div className="mx-auto w-full max-w-[1600px] px-6 py-16 md:px-10 xl:px-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="text-display text-xl font-semibold text-primary">CAP</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {dict.meta.description}
            </p>
            <p className="mt-5 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/70">
              {dict.hero.offices}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-primary">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {dict.meta.siteName}</p>
          <div className="flex gap-5">
            <Link href={`/${lang}/terms`} className="transition-colors hover:text-muted-foreground">
              {dict.footer.terms}
            </Link>
            <Link href={`/${lang}/privacy`} className="transition-colors hover:text-muted-foreground">
              {dict.footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
