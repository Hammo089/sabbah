// app/[lang]/admin/(dashboard)/settings/page.tsx — SERVER COMPONENT
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCurrentProfile, isAdmin } from '@/lib/auth/rbac';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/admin/settings-form';
import { DEFAULT_SETTINGS, mergeSettings } from '@/lib/queries/settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;

  // The sidebar hides this module from editors; a guessable URL is not access
  // control, so the page enforces the same rule the actions do.
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/${locale}/403`);
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', true).maybeSingle();

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.settings}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{dict.admin.settingsHint}</p>

      <div className="mt-8">
        <SettingsForm
          values={data ? mergeSettings(data) : DEFAULT_SETTINGS}
          labels={{ save: dict.admin.save, saved: dict.admin.saved }}
          upload={{ ...dict.upload }}
        />
      </div>
    </div>
  );
}
