// app/[lang]/(auth)/layout.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { isLocale, localeDirection } from '@/i18n/config';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <div
      dir={localeDirection[lang]}
      className="grain relative flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(80% 60% at 50% 0%, rgba(203,163,66,0.14) 0%, transparent 65%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
      {children}
    </div>
  );
}
