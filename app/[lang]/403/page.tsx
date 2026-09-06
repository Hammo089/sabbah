// app/[lang]/403/page.tsx — SERVER COMPONENT
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { isLocale, localeDirection } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export const metadata = { title: 'Access denied', robots: { index: false } };

export default async function ForbiddenPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <main
      dir={localeDirection[lang]}
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center"
    >
      <ShieldAlert className="size-10 text-primary" />
      <h1 className="text-display text-3xl font-light text-foreground">{dict.auth.forbidden}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{dict.auth.forbiddenHint}</p>
      <Link
        href={`/${lang}`}
        className="mt-2 rounded-md border border-primary/35 px-5 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
      >
        {dict.auth.backHome}
      </Link>
    </main>
  );
}
