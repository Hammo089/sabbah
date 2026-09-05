// app/[lang]/admin/(dashboard)/people/[id]/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PersonForm, type PersonFormValues } from '@/components/admin/person-form';
import { t } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const EMPTY: PersonFormValues = {
  slug: '', name: {}, bio: {}, photo_url: null, birth_year: null, nationality: null, is_published: true,
};

export default async function PersonEditorPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const isNew = id === 'new';

  let values = EMPTY;
  let heading = dict.admin.addPerson;

  if (!isNew) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('people').select('*').eq('id', id).maybeSingle();
    if (!data) notFound();

    values = {
      id: data.id,
      slug: data.slug,
      name: (data.name ?? {}) as Record<string, string>,
      bio: (data.bio ?? {}) as Record<string, string>,
      photo_url: data.photo_url,
      birth_year: data.birth_year,
      nationality: data.nationality,
      is_published: data.is_published,
    };
    heading = t(data.name, locale, data.slug);
  }

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href={`/${locale}/admin/people`} className="hover:text-primary">
          {dict.admin.people}
        </Link>
        <ChevronRight className="size-3 rtl:rotate-180" />
        <span className="text-foreground">{heading}</span>
      </nav>

      <h1 className="mt-3 text-display text-2xl font-light">{heading}</h1>

      <div className="mt-8">
        <PersonForm
          values={values}
          labels={{ save: dict.admin.save, saved: dict.admin.saved }}
          upload={{ ...dict.upload }}
        />
      </div>
    </div>
  );
}
