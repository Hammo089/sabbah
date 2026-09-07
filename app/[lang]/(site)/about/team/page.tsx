// app/[lang]/(site)/about/team/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/site/page-shell';
import { getTeam } from '@/lib/queries/pages';
import { Reveal } from '@/components/motion/reveal';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: dict.pages.teamTitle,
    description: dict.pages.teamLead,
    siteName: dict.meta.siteName,
    path: 'about/team',
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, team] = await Promise.all([getDictionary(locale), getTeam(locale)]);

  return (
    <PageShell eyebrow={dict.nav.company} title={dict.pages.teamTitle} lead={dict.pages.teamLead}>
      {team.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">{dict.pages.teamEmpty}</p>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((member, i) => (
            <Reveal key={member.id} delay={Math.min(i, 8) * 0.05} amount={0.15}>
              <article className="group">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted/40 ring-1 ring-border transition-all group-hover:ring-primary/40">
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl font-light text-muted-foreground/30">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                </div>

                <h2 className="mt-4 text-sm font-medium text-foreground">{member.name}</h2>
                {member.jobTitle && (
                  <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-primary/80">
                    {member.jobTitle}
                  </p>
                )}
                {member.bio && (
                  <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {member.bio}
                  </p>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </PageShell>
  );
}
