// components/admin/admin-sidebar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Clapperboard, Film, Tv, ListVideo,
  ShieldCheck, Landmark, Megaphone, Users, Settings, UserSquare2, Radio, Palette, Inbox,
  Hash, Library, FileDown, Newspaper, Instagram, BellRing, Activity, Globe, Briefcase,
  Clapperboard as Slate, Menu, X,
} from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { AppRole } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/site/brand-logo';

type NavItem = {
  href: string;
  /** Fallback only. The label is looked up in dict.adminNav by `href` first, so
      the tri-lingual RTL admin stops shipping hardcoded English navigation. */
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppRole[];
};

const NAV: NavItem[] = [
  { href: '',          label: 'Overview',  icon: LayoutDashboard, roles: ['super_admin', 'admin', 'editor'] },
  { href: '/series',   label: 'Series',    icon: Tv,              roles: ['super_admin', 'admin', 'editor'] },
  { href: '/movies',   label: 'Films',     icon: Film,            roles: ['super_admin', 'admin', 'editor'] },
  { href: '/programs', label: 'Programs',  icon: Clapperboard,    roles: ['super_admin', 'admin', 'editor'] },
  { href: '/episodes', label: 'Episodes',  icon: ListVideo,       roles: ['super_admin', 'admin', 'editor'] },
  { href: '/people',   label: 'Cast & Crew', icon: UserSquare2,   roles: ['super_admin', 'admin', 'editor'] },
  { href: '/submissions', label: 'Submissions', icon: Inbox,      roles: ['super_admin', 'admin', 'editor'] },
  { href: '/drm',      label: 'DRM & Licensing', icon: ShieldCheck, roles: ['super_admin'] },
  { href: '/broadcasters', label: 'Broadcasters', icon: Radio,      roles: ['super_admin', 'admin', 'editor'] },
  { href: '/leads',    label: 'B2B Buyers', icon: Briefcase,      roles: ['super_admin', 'admin'] },
  { href: '/tags',     label: 'Tags',      icon: Hash,            roles: ['super_admin', 'admin', 'editor'] },
  { href: '/library',  label: 'Library',   icon: Library,         roles: ['super_admin', 'admin', 'editor'] },
  { href: '/scenes',   label: 'Master Scenes', icon: Slate,       roles: ['super_admin', 'admin', 'editor'] },
  { href: '/news',     label: 'News & Press', icon: Newspaper,    roles: ['super_admin', 'admin', 'editor'] },
  { href: '/social',   label: 'Social Media', icon: Instagram,    roles: ['super_admin', 'admin', 'editor'] },
  { href: '/exports',  label: 'Exports',   icon: FileDown,        roles: ['super_admin', 'admin', 'editor'] },
  { href: '/legacy',   label: 'Legacy',    icon: Landmark,        roles: ['super_admin', 'admin'] },
  { href: '/ticker',   label: 'News Ticker', icon: Megaphone,     roles: ['super_admin', 'admin', 'editor'] },
  { href: '/notifications', label: 'Notifications', icon: BellRing, roles: ['super_admin', 'admin', 'editor'] },
  { href: '/tracking', label: 'Tracking',  icon: Activity,        roles: ['super_admin', 'admin'] },
  { href: '/website',  label: 'Website',   icon: Globe,           roles: ['super_admin', 'admin'] },
  { href: '/users',    label: 'Users',     icon: Users,           roles: ['super_admin'] },
  { href: '/appearance', label: 'Appearance', icon: Palette,      roles: ['super_admin', 'admin'] },
  { href: '/settings', label: 'Settings',  icon: Settings,        roles: ['super_admin', 'admin'] },
];

/** Looks a nav label up in the dictionary, falling back to the English literal. */
function navLabel(dict: Dictionary, item: NavItem): string {
  const key = item.href === '' ? 'overview' : item.href.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const table = (dict as unknown as { adminNav?: Record<string, string> }).adminNav;
  return table?.[key] ?? item.label;
}

function NavBody({
  lang,
  items,
  dict,
  expiringCount,
  newSubmissions,
  onNavigate,
}: {
  lang: Locale;
  items: NavItem[];
  dict: Dictionary;
  expiringCount: number;
  newSubmissions: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = `/${lang}/admin`;

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {items.map((item) => {
        const { href, icon: Icon } = item;
        const full = `${base}${href}`;
        // Overview matches only itself; every other item also matches its
        // sub-routes, so /admin/series/<id> keeps "Series" lit.
        const active = href === '' ? pathname === full : pathname === full || pathname.startsWith(`${full}/`);
        const badge = href === '/drm' ? expiringCount : href === '/submissions' ? newSubmissions : 0;

        return (
          <Link
            key={href}
            href={full}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{navLabel(dict, item)}</span>
            {badge > 0 && (
              <span className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500/90 text-[10px] font-semibold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({
  lang,
  role,
  dict,
  expiringCount = 0,
  newSubmissions = 0,
}: {
  lang: Locale;
  role: AppRole;
  dict: Dictionary;
  /** super_admin only — the RPC returns 0 for every other role. */
  expiringCount?: number;
  /** staff only — the RPC returns 0 for everyone else. */
  newSubmissions?: number;
}) {
  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-e border-border bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <BrandLogo variant="mark" className="h-8 w-auto" />
        <span className="truncate text-xs uppercase tracking-widest text-muted-foreground">
          {dict.meta.siteName}
        </span>
      </div>

      <NavBody
        lang={lang}
        items={items}
        dict={dict}
        expiringCount={expiringCount}
        newSubmissions={newSubmissions}
      />

      <div className="border-t border-border p-3">
        <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
          {role.replace('_', ' ')}
        </span>
      </div>
    </aside>
  );
}

/**
 * The same navigation as a drawer for phones.
 *
 * The sidebar is `hidden md:flex` and the topbar had no trigger, so below
 * 768px the admin had NO navigation at all — from any sub-page the only route
 * to another module was the browser back button.
 */
export function AdminMobileNav({
  lang,
  role,
  dict,
  expiringCount = 0,
  newSubmissions = 0,
}: {
  lang: Locale;
  role: AppRole;
  dict: Dictionary;
  expiringCount?: number;
  newSubmissions?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const items = NAV.filter((item) => item.roles.includes(role));
  const label = (dict as unknown as { admin?: Record<string, string> }).admin?.menu ?? 'Menu';

  // Escape closes; the body is locked so the page behind cannot scroll away.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-expanded={open}
        className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-background shadow-2xl"
          >
            <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
              <BrandLogo variant="mark" className="h-7 w-auto" />
              <span className="truncate text-xs uppercase tracking-widest text-muted-foreground">
                {dict.meta.siteName}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={(dict as unknown as { admin?: Record<string, string> }).admin?.cancel ?? 'Close'}
                className="ms-auto grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <NavBody
              lang={lang}
              items={items}
              dict={dict}
              expiringCount={expiringCount}
              newSubmissions={newSubmissions}
              onNavigate={() => setOpen(false)}
            />

            <div className="border-t border-border p-3">
              <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                {role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
