// components/site/page-shell.tsx — SERVER COMPONENT (Reveal is the client leaf)
import { Reveal } from '@/components/motion/reveal';
import { getSiteSettings } from '@/lib/queries/settings';
import { cn } from '@/lib/utils';

export async function PageShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  // One frosted surface per page. Glass on every card would mean dozens of
  // backdrop-filter layers re-blurring the film on every frame.
  const settings = await getSiteSettings();
  const glass = settings.glass_enabled && settings.backdrop_enabled;
  return (
    <main
      className={cn(
        'mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-28',
        glass && 'my-10 rounded-[20px] md:my-16',
        glass && 'glass',
      )}
    >
      <Reveal>
        {eyebrow && (
          <p className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-primary">
            <span className="inline-block h-px w-8 bg-primary/70" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-5 text-display text-[clamp(2rem,5vw,3.6rem)] font-light leading-tight text-foreground">
          {title}
        </h1>
        {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{lead}</p>}
      </Reveal>

      <Reveal delay={0.12}>{children}</Reveal>
    </main>
  );
}
