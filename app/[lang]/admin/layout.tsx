// app/[lang]/admin/layout.tsx
// SERVER COMPONENT — no 'use client'. Auth + RBAC gate for the entire panel.
import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { isLocale, localeDirection, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STAFF_ROLES, type Profile } from '@/lib/auth/rbac';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Admin — Cedars Art Production',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const supabase = await createSupabaseServerClient();

  // 1. Verified session (getUser hits the Auth server — never trust getSession here).
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/login?next=/${locale}/admin`);
  }

  // 2. Role check against users_profiles.
  const { data: profile, error: profileError } = await supabase
    .from('users_profiles')
    .select('id, email, full_name, avatar_url, role, is_active, locale')
    .eq('id', user.id)
    .single<Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role' | 'is_active' | 'locale'>>();

  if (profileError || !profile) {
    redirect(`/${locale}/login?error=profile_missing`);
  }

  // 3. Hard block: inactive accounts and non-staff roles never render children.
  if (!profile.is_active || !STAFF_ROLES.includes(profile.role)) {
    redirect(`/${locale}/403`);
  }

  const dict = await getDictionary(locale);
  const dir = localeDirection[locale];

  return (
    <div className="flex min-h-dvh bg-muted/30" dir={dir}>
      <AdminSidebar lang={locale} role={profile.role} dict={dict} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          lang={locale}
          user={{
            email: profile.email,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
          }}
          signOutLabel={dict.auth.signOut}
        />

        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      <Toaster richColors position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'} />
    </div>
  );
}
