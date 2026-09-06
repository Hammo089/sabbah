// app/[lang]/(site)/submit/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Lock, Clock, Eye } from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteSettings } from '@/lib/queries/settings';
import { PageShell } from '@/components/site/page-shell';
import { SubmitForm } from '@/components/site/submit-form';
import { AssistantChat } from '@/components/site/assistant-chat';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.submit.title,
    description: dict.submit.lead,
    siteName: dict.meta.siteName,
    path: 'submit',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);

  if (!settings.submissions_open) {
    return (
      <PageShell eyebrow={dict.submit.eyebrow} title={dict.submit.closedTitle}>
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {dict.submit.closedBody}
        </p>
      </PageShell>
    );
  }

  const promises = [
    { icon: Lock, text: dict.submit.privacyNote },
    { icon: Eye, text: dict.assistant.subtitle },
    { icon: Clock, text: dict.submit.successBody },
  ];

  return (
    <>
      <PageShell eyebrow={dict.submit.eyebrow} title={dict.submit.title} lead={dict.submit.lead}>
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-3">
          {promises.map(({ icon: Icon, text }, i) => (
            <div key={i} className="bg-background p-5">
              <Icon className="size-4 text-primary" />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <SubmitForm lang={locale} dict={dict.submit} />

          {settings.assistant_enabled && (
            <aside className="lg:sticky lg:top-24">
              <p className="mb-4 text-[0.65rem] uppercase tracking-[0.24em] text-primary">
                {dict.assistant.title}
              </p>
              <AssistantChat lang={locale} dict={dict.assistant} variant="inline" />
            </aside>
          )}
        </div>
      </PageShell>
    </>
  );
}
