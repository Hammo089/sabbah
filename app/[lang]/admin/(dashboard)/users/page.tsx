// app/[lang]/admin/(dashboard)/users/page.tsx — SERVER COMPONENT
// super_admin only. The admin layout already blocks non-staff; this page adds
// the narrower super_admin gate because roles are the keys to the whole system.
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isSuperAdmin } from '@/lib/auth/rbac';
import { RoleSelect } from '@/components/admin/role-select';
import { InviteUser } from '@/components/admin/invite-user';
import { CreateUser } from '@/components/admin/create-user';
import { ActiveToggle } from '@/components/admin/active-toggle';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();

  if (!isSuperAdmin(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // This is the one admin table that grows with every signup — b2b_client and
  // viewer rows included — so it is the one that must not fetch unbounded.
  const [{ data, count }, { data: invites }] = await Promise.all([
    supabase
      .from('users_profiles')
      .select('id, email, full_name, role, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1),
    supabase
      .from('user_invitations')
      .select('email, role, created_at')
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const rows = data ?? [];
  const total = count ?? rows.length;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.users}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{total}</p>

      <div className="mt-8">
        <CreateUser
          labels={{
            title: dict.admin.addUser,
            hint: dict.admin.addUserHint,
            email: 'Email',
            fullName: dict.admin.fullName,
            role: dict.admin.role,
            password: dict.admin.tempPassword,
            passwordHint: dict.admin.tempPasswordHint,
            create: dict.admin.createUser,
            created: dict.admin.userCreated,
            copy: dict.admin.copyPassword,
            copied: dict.admin.copied,
          }}
        />
      </div>

      <div className="mt-6">
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
              <th className="w-32 p-3 text-start font-medium">{dict.admin.active}</th>
              <th className="w-36 p-3 text-start font-medium">{dict.admin.joined}</th>
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

                <td className="p-3">
                  <ActiveToggle
                    userId={row.id}
                    defaultValue={row.is_active}
                    isSelf={row.id === profile?.id}
                    labels={{
                      active: dict.admin.active,
                      inactive: dict.admin.inactive,
                      deactivate: dict.admin.deactivate,
                      activate: dict.admin.activate,
                    }}
                  />
                </td>

                <td className="p-3 text-xs text-muted-foreground" dir="ltr">
                  {new Date(row.created_at).toLocaleDateString(locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <nav className="mt-5 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={`?page=${page - 1}`}
              className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              ‹
            </Link>
          ) : (
            <span />
          )}

          <span className="text-xs text-muted-foreground">
            {page} / {lastPage}
          </span>

          {page < lastPage ? (
            <Link
              href={`?page=${page + 1}`}
              className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              ›
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
