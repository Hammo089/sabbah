// app/[lang]/admin/(dashboard)/notifications/page.tsx — SERVER COMPONENT
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff, isSuperAdmin } from '@/lib/auth/rbac';
import { NotificationList, type NotifRow } from '@/components/admin/notification-list';
import { getExpiringLicences } from '@/lib/queries/licences';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const [{ data: stored }, { data: newSubs }, expiring] = await Promise.all([
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('script_submissions').select('id, ref, work_title').eq('status', 'new').limit(20),
    isSuperAdmin(profile) ? getExpiringLicences() : Promise.resolve([]),
  ]);

  // Live alerts are derived, not stored: a contract that is 12 days out today
  // should not still say 12 days next week.
  const live: NotifRow[] = [
    ...expiring.map((l) => ({
      id: `licence-${l.id}`,
      level: (l.expired ? 'danger' : 'warning') as NotifRow['level'],
      title: `${l.licensee_company ?? l.licensee_name ?? '—'} · ${l.ends_on}`,
      body: l.expired
        ? dict.licence.expired
        : dict.licence.expiresIn.replace('{n}', String(l.days_left)),
      href: `/${locale}/admin/drm`,
      is_read: false,
      created_at: new Date().toISOString(),
    })),
    ...(newSubs ?? []).map((s) => ({
      id: `submission-${s.id}`,
      level: 'info' as const,
      title: s.work_title,
      body: s.ref,
      href: `/${locale}/admin/submissions`,
      is_read: false,
      created_at: new Date().toISOString(),
    })),
  ];

  const rows: NotifRow[] = [
    ...live,
    ...(stored ?? []).map((r) => ({
      id: r.id,
      level: r.level,
      title: r.title,
      body: r.body,
      href: r.href,
      is_read: r.is_read,
      created_at: r.created_at,
    })),
  ];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.notifications}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.filter((r) => !r.is_read).length}</p>

      <div className="mt-8 max-w-3xl">
        <NotificationList
          rows={rows}
          dict={{ markAll: dict.admin.markAllRead, empty: dict.admin.noNotifications }}
        />
      </div>
    </div>
  );
}
