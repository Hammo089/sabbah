// app/[lang]/(site)/layout.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { NewsTicker } from '@/components/site/news-ticker';
import { getSiteSettings } from '@/lib/queries/settings';
import { BrandLoader } from '@/components/site/brand-loader';
import { AmbientFilm } from '@/components/site/ambient-film';
import { SiteBackdrop } from '@/components/site/site-backdrop';
import { AssistantChat } from '@/components/site/assistant-chat';

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
  const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* The self-hosted anniversary film. Takes precedence over the older
          YouTube ambient layer — running both would decode two videos at once. */}
      {settings.backdrop_enabled && settings.backdrop_scope === 'all' && (
        <SiteBackdrop
          loopUrl={settings.backdrop_loop_url}
          webmUrl={settings.backdrop_webm_url}
          posterUrl={settings.backdrop_poster_url}
          brightness={settings.backdrop_brightness}
          blur={settings.backdrop_blur}
          allowOnMobile={settings.backdrop_on_mobile}
        />
      )}

      {!settings.backdrop_enabled &&
        settings.bg_video_enabled &&
        settings.bg_video_scope === 'all' && (
          <AmbientFilm youtubeId={settings.bg_video_youtube} opacity={settings.bg_video_opacity} />
        )}

      {settings.loader_enabled && (
        <BrandLoader
          style={settings.loader_style}
          speed={settings.loader_speed}
          logoUrl={settings.loader_logo_url}
          wordmark={dict.meta.siteName}
        />
      )}

      <NewsTicker lang={locale} />
      <SiteHeader
        lang={locale}
        dict={dict}
        headerStyle={settings.header_style}
        glass={settings.glass_enabled}
      />
      <div className="flex-1">{children}</div>
      <SiteFooter lang={locale} dict={dict} glass={settings.glass_enabled} />

      {settings.assistant_enabled && <AssistantChat lang={locale} dict={dict.assistant} />}
    </div>
  );
}
