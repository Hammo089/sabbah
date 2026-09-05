// app/[lang]/(site)/layout.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { NewsTicker } from '@/components/site/news-ticker';

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0a0a0a]">
      <NewsTicker lang={locale} />
      <SiteHeader lang={locale} dict={dict} />
      <div className="flex-1">{children}</div>
      <SiteFooter lang={locale} dict={dict} />
    </div>
  );
}
