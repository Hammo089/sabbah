// app/[lang]/admin/(dashboard)/users/page.tsx — SERVER COMPONENT
// super_admin only. The admin layout already blocks non-staff; this page adds
// the narrower super_admin gate because roles are the keys to the whole system.
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isSuperAdmin } from '@/lib/auth/rbac';
import { RoleSelect } from '@/components/admin/role-select';
import { InviteUser } from '@/components/admin/invite-user';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();

  if (!isSuperAdmin(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const [{ data }, { data: invites }] = await Promise.all([
    supabase
      .from('users_profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('user_invitations')
      .select('email, role, created_at')
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const rows = data ?? [];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.users}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length}</p>

      <div className="mt-8">
        <InviteUser
          pending={invites ?? []}
          labels={{
            invite: dict.admin.invite,
            hint: dict.admin.inviteHint,
            pending: dict.admin.pendingInvites,
            cancel: dict.admin.cancel,
            invited: dict.admin.invited,
          }}
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="p-3 text-start font-medium">{dict.admin.users}</th>
              <th className="w-52 p-3 text-start font-medium">{dict.admin.role}</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <p className="font-medium">
                    {row.full_name ?? row.email}
                    {row.id === profile?.id && (
                      <span className="ms-2 rounded bg-primary/15 px-1.5 py-0.5 text-[0.65rem] text-primary">
                        {dict.admin.self}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {row.email}
                  </p>
                </td>

                <td className="p-3">
                  <RoleSelect
                    userId={row.id}
                    defaultValue={row.role}
                    isSelf={row.id === profile?.id}
                    messages={{
                      updated: dict.admin.roleUpdated,
                      failed: dict.admin.roleFailed,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
