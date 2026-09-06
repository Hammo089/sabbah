// app/[lang]/(auth)/login/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const { next } = await searchParams;
  const dict = await getDictionary(locale);

  // Already signed in — skip the form.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(`/${locale}/admin`);

  return (
    <main className="relative z-10 w-full max-w-sm">
      <div className="mb-10 text-center">
        <p className="text-[0.65rem] uppercase tracking-[0.34em] text-primary">
          {dict.meta.siteName}
        </p>
        <h1 className="mt-4 text-display text-3xl font-light text-foreground">
          {dict.auth.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.auth.subtitle}</p>
      </div>

      <LoginForm lang={locale} dict={dict.auth} next={next} />
    </main>
  );
}
