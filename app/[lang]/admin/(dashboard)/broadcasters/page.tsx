// app/[lang]/admin/(dashboard)/broadcasters/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BroadcasterManager } from '@/components/admin/broadcaster-manager';

export const dynamic = 'force-dynamic';

export default async function AdminBroadcastersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('broadcasters').select('*').order('sort_order');

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.broadcasters}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{(data ?? []).length}</p>

      <div className="mt-8">
        <BroadcasterManager
          rows={data ?? []}
          labels={{
            save: dict.admin.save,
            saved: dict.admin.saved,
            remove: dict.admin.remove,
            add: dict.admin.addBroadcaster,
          }}
        />
      </div>
    </div>
  );
}
