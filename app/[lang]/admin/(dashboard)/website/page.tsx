// app/[lang]/admin/(dashboard)/website/page.tsx — SERVER COMPONENT
// Every public route in one place, with what controls it. The old CAPDAMS had
// a "Website" tile; this is the useful version of it — jump to any live page,
// or to the screen that governs it.
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ExternalLink, Settings2 } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCurrentProfile, hasRole } from '@/lib/auth/rbac';
import { getSiteSettings } from '@/lib/queries/settings';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!hasRole(profile, 'super_admin', 'admin')) redirect(`/${locale}/403`);

  const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);

  const pages: { path: string; label: string; controlledBy?: string; live?: boolean }[] = [
    { path: '', label: dict.nav.home, controlledBy: '/appearance' },
    { path: 'catalog', label: dict.nav.catalog },
    { path: 'scripts', label: dict.nav.scripts },
    { path: 'about', label: dict.nav.company },
    { path: 'about/team', label: dict.pages.teamTitle },
    { path: 'services', label: dict.nav.services },
    { path: 'legacy', label: dict.nav.legacy, controlledBy: '/legacy' },
    { path: 'press', label: dict.nav.news, controlledBy: '/news' },
    { path: 'partners', label: dict.nav.partners, controlledBy: '/broadcasters' },
    { path: 'b2b', label: dict.nav.b2b, controlledBy: '/leads' },
    { path: 'submit', label: dict.nav.submit, controlledBy: '/submissions', live: settings.submissions_open },
    { path: 'contact', label: dict.nav.contact },
    { path: 'search', label: dict.nav.search },
    { path: 'terms', label: dict.legal.termsTitle },
    { path: 'privacy', label: dict.legal.privacyTitle },
  ];

  const switches: { label: string; on: boolean }[] = [
    { label: dict.appearance.stats, on: settings.show_stats },
    { label: dict.appearance.marquee, on: settings.show_marquee },
    { label: dict.appearance.showcase, on: settings.show_showcase },
    { label: dict.appearance.rails, on: settings.show_rails },
    { label: dict.appearance.partners, on: settings.show_partners },
    { label: dict.admin.ticker, on: settings.ticker_enabled },
    { label: dict.appearance.bgVideo, on: settings.bg_video_enabled },
    { label: dict.appearance.loader, on: settings.loader_enabled },
    { label: dict.appearance.submissionsOpen, on: settings.submissions_open },
    { label: dict.appearance.assistantOn, on: settings.assistant_enabled },
  ];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.website}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{pages.length}</p>

      <div className="mt-8 grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <tbody>
              {pages.map((p) => (
                <tr key={p.path} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <p className="font-medium">{p.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      /{locale}/{p.path}
                    </p>
                  </td>

                  <td className="w-32 p-3 text-end">
                    {p.controlledBy && (
                      <Link
                        href={`/${locale}/admin${p.controlledBy}`}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Settings2 className="size-3.5" />
                        {p.controlledBy.replace('/', '')}
                      </Link>
                    )}
                  </td>

                  <td className="w-20 p-3 text-end">
                    <Link
                      href={`/${locale}/${p.path}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      {dict.admin.openPage}
                      <ExternalLink className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">
            {dict.appearance.sections}
          </p>

          <ul className="mt-4 space-y-2.5">
            {switches.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{s.label}</span>
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    s.on ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                  )}
                />
              </li>
            ))}
          </ul>

          <Link
            href={`/${locale}/admin/appearance`}
            className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary hover:underline"
          >
            {dict.admin.appearance}
            <Settings2 className="size-3.5" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
