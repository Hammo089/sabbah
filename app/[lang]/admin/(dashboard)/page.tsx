// app/[lang]/admin/(dashboard)/page.tsx — SERVER COMPONENT
// The module grid, laid out like the CAPDAMS home screen it replaces: every
// area of the system is one tile, reachable in a single click, with its live
// record count on the face of the tile.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  UserCog, Activity, Settings, Globe, BellRing,
  Clapperboard, Tv, Users, Contact, Radio,
  Instagram, Youtube, Facebook, Twitter, Hash,
  Library, FileDown, ShieldCheck, Clapperboard as Slate, Newspaper,
  Inbox, Briefcase, ListVideo, Film, Palette, Landmark, Megaphone,
} from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isSuperAdmin, isStaff, type AppRole } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Tile = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** key into module_counts() */
  count?: string;
  roles: AppRole[];
  /** paints the count in alert colours when it is non-zero */
  alert?: boolean;
  tone?: string;
};

async function getCounts(): Promise<Record<string, number>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.rpc('module_counts');
    return (data ?? {}) as Record<string, number>;
  } catch {
    return {};
  }
}

export default async function AdminHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, profile, counts] = await Promise.all([
    getDictionary(locale),
    getCurrentProfile(),
    getCounts(),
  ]);

  if (!isStaff(profile)) notFound();
  const role = profile!.role;

  const ALL: AppRole[] = ['super_admin', 'admin', 'editor'];
  const ADMIN: AppRole[] = ['super_admin', 'admin'];
  const SUPER: AppRole[] = ['super_admin'];

  const groups: { title: string; tiles: Tile[] }[] = [
    {
      title: dict.admin.groupCatalog,
      tiles: [
        { href: '/programs', label: dict.admin.programs, icon: Clapperboard, count: 'programs', roles: ALL },
        { href: '/series', label: dict.admin.seasons, icon: Tv, count: 'seasons', roles: ALL },
        { href: '/movies', label: dict.admin.films, icon: Film, roles: ALL },
        { href: '/episodes', label: dict.admin.episodes, icon: ListVideo, count: 'episodes', roles: ALL },
        { href: '/people', label: dict.admin.castCrew, icon: Users, count: 'cast', roles: ALL },
        { href: '/tags', label: dict.admin.tags, icon: Hash, count: 'tags', roles: ALL },
      ],
    },
    {
      title: dict.admin.groupRights,
      tiles: [
        { href: '/drm', label: dict.admin.drm, icon: ShieldCheck, count: 'drm', roles: SUPER },
        { href: '/broadcasters', label: dict.admin.broadcasters, icon: Radio, count: 'broadcasters', roles: ALL },
        { href: '/leads', label: dict.admin.leads, icon: Briefcase, count: 'leads', roles: ADMIN },
        { href: '/exports', label: dict.admin.exports, icon: FileDown, count: 'exports', roles: ALL },
      ],
    },
    {
      title: dict.admin.groupMedia,
      tiles: [
        { href: '/library', label: dict.admin.library, icon: Library, count: 'library', roles: ALL },
        { href: '/scenes', label: dict.admin.masterScenes, icon: Slate, count: 'scenes', roles: ALL },
        { href: '/submissions', label: dict.admin.submissions, icon: Inbox, count: 'submissions', roles: ALL, alert: true },
      ],
    },
    {
      title: dict.admin.groupPublishing,
      tiles: [
        { href: '/news', label: dict.admin.newsPress, icon: Newspaper, count: 'news', roles: ALL },
        { href: '/ticker', label: dict.admin.ticker, icon: Megaphone, roles: ALL },
        { href: '/legacy', label: dict.admin.legacy, icon: Landmark, roles: ADMIN },
        { href: '/social', label: dict.admin.social, icon: Instagram, count: 'social', roles: ALL },
      ],
    },
    {
      title: dict.admin.groupSystem,
      tiles: [
        { href: '/notifications', label: dict.admin.notifications, icon: BellRing, count: 'notifications', roles: ALL, alert: true },
        { href: '/tracking', label: dict.admin.tracking, icon: Activity, roles: ADMIN },
        { href: '/appearance', label: dict.admin.appearance, icon: Palette, roles: ADMIN },
        { href: '/website', label: dict.admin.website, icon: Globe, roles: ADMIN },
        { href: '/users', label: dict.admin.users, icon: UserCog, count: 'users', roles: SUPER },
        { href: '/settings', label: dict.admin.settings, icon: Settings, roles: ADMIN },
      ],
    },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl font-light">{dict.admin.overview}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.full_name ?? profile?.email}
          </p>
        </div>

        <span className="rounded bg-primary/12 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-primary">
          {role.replace('_', ' ')}
        </span>
      </header>

      <div className="mt-10 space-y-12">
        {groups.map((group) => {
          const tiles = group.tiles.filter((t) => t.roles.includes(role));
          if (tiles.length === 0) return null;

          return (
            <section key={group.title}>
              <p className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.24em] text-primary">
                <span className="inline-block h-px w-7 bg-primary/70" />
                {group.title}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {tiles.map(({ href, label, icon: Icon, count, alert }) => {
                  const value = count ? (counts[count] ?? 0) : null;
                  const hot = Boolean(alert && value && value > 0);

                  return (
                    <Link
                      key={href}
                      href={`/${locale}/admin${href}`}
                      className={cn(
                        'group relative flex aspect-square flex-col items-center justify-center gap-3 rounded-lg',
                        'border border-border bg-card p-4 text-center transition-all duration-300',
                        'hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_12px_32px_-16px_hsl(var(--primary)/0.5)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                    >
                      {hot && (
                        <span className="absolute end-2.5 top-2.5 grid min-w-5 place-items-center rounded-full bg-red-500/90 px-1.5 text-[10px] font-semibold text-white">
                          {value! > 99 ? '99+' : value}
                        </span>
                      )}

                      <span className="grid size-12 place-items-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/18">
                        <Icon className="size-6 text-primary" />
                      </span>

                      <span className="text-[0.78rem] font-medium leading-tight">{label}</span>

                      {value !== null && !hot && (
                        <span className="text-[0.7rem] tabular-nums text-muted-foreground">{value}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {isSuperAdmin(profile) && (
        <p className="mt-14 text-xs text-muted-foreground">
          {dict.admin.publishedCount}: {counts.published ?? 0} / {counts.seasons ?? 0}
        </p>
      )}
    </div>
  );
}
