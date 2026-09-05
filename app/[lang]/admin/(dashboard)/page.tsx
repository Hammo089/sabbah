// app/[lang]/admin/(dashboard)/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Tv, Star, CheckCircle2, Users } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isSuperAdmin } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

async function counts() {
  const supabase = await createSupabaseServerClient();

  const [total, published, featured, staff] = await Promise.all([
    supabase.from('series').select('id', { count: 'exact', head: true }),
    supabase.from('series').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_featured_slider', true),
    supabase.from('users_profiles').select('id', { count: 'exact', head: true })
      .in('role', ['super_admin', 'admin', 'editor']),
  ]);

  return {
    total: total.count ?? 0,
    published: published.count ?? 0,
    featured: featured.count ?? 0,
    staff: staff.count ?? 0,
  };
}

export default async function AdminOverview({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const [c, profile] = await Promise.all([counts(), getCurrentProfile()]);

  const tiles = [
    { label: dict.admin.totalTitles, value: c.total, icon: Tv, href: `/${locale}/admin/series` },
    { label: dict.admin.publishedCount, value: c.published, icon: CheckCircle2, href: `/${locale}/admin/series` },
    { label: dict.admin.featuredCount, value: c.featured, icon: Star, href: `/${locale}/admin/series` },
    ...(isSuperAdmin(profile)
      ? [{ label: dict.admin.staffCount, value: c.staff, icon: Users, href: `/${locale}/admin/users` }]
      : []),
  ];

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.overview}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-3 text-display text-3xl font-light">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
