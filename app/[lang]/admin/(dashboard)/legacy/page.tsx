// app/[lang]/admin/(dashboard)/legacy/page.tsx — SERVER COMPONENT
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCurrentProfile, isAdmin } from '@/lib/auth/rbac';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LegacyManager } from '@/components/admin/legacy-manager';

export const dynamic = 'force-dynamic';

export default async function AdminLegacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;

  // The sidebar hides this module from editors; a guessable URL is not access
  // control, so the page enforces the same rule the actions do.
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/${locale}/403`);
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('company_legacy')
    .select('*')
    .order('year', { ascending: true })
    .order('sort_order', { ascending: true });

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.legacy}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{(data ?? []).length}</p>

      <div className="mt-8">
        <LegacyManager
          rows={(data ?? []).map((r) => ({
            id: r.id,
            title: (r.title ?? {}) as Record<string, string>,
            description: (r.description ?? {}) as Record<string, string>,
            video_url: r.video_url,
            poster_url: r.poster_url,
            year: r.year,
            is_published: r.is_published,
            sort_order: r.sort_order,
          }))}
          labels={{ save: dict.admin.save, saved: dict.admin.saved, remove: dict.admin.remove, add: dict.admin.addItem }}
          upload={{ ...dict.upload }}
        />
      </div>
    </div>
  );
}
