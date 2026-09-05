// components/admin/admin-topbar.tsx — SERVER COMPONENT (client bits are leaf components)
import type { Locale } from '@/i18n/config';
import type { AppRole } from '@/lib/auth/rbac';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LocaleSwitcher } from '@/components/site/locale-switcher';

export function AdminTopbar({
  lang,
  user,
}: {
  lang: Locale;
  user: { email: string; fullName: string | null; avatarUrl: string | null; role: AppRole };
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.fullName ?? user.email}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <LocaleSwitcher currentLocale={lang} />
        <ThemeToggle />
      </div>
    </header>
  );
}
