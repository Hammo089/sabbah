// components/admin/admin-sidebar.tsx — SERVER COMPONENT
import Link from 'next/link';
import {
  LayoutDashboard, Clapperboard, Film, Tv, ListVideo,
  ShieldCheck, Landmark, Megaphone, Users, Settings, UserSquare2, Radio,
} from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { AppRole } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
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
  { href: '/drm',      label: 'DRM & Licensing', icon: ShieldCheck, roles: ['super_admin'] },
  { href: '/broadcasters', label: 'Broadcasters', icon: Radio,      roles: ['super_admin', 'admin', 'editor'] },
  { href: '/legacy',   label: 'Legacy',    icon: Landmark,        roles: ['super_admin', 'admin'] },
  { href: '/ticker',   label: 'News Ticker', icon: Megaphone,     roles: ['super_admin', 'admin', 'editor'] },
  { href: '/users',    label: 'Users',     icon: Users,           roles: ['super_admin'] },
  { href: '/settings', label: 'Settings',  icon: Settings,        roles: ['super_admin', 'admin'] },
];

export function AdminSidebar({
  lang,
  role,
  dict,
}: {
  lang: Locale;
  role: AppRole;
  dict: Dictionary;
}) {
  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-e border-border bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="text-display text-lg font-semibold text-primary">CAP</span>
        <span className="truncate text-xs uppercase tracking-widest text-muted-foreground">
          {dict.meta.siteName}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={`/${lang}/admin${href}`}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground',
              'transition-colors hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
          {role.replace('_', ' ')}
        </span>
      </div>
    </aside>
  );
}
