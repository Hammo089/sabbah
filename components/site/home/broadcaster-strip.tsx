// components/site/home/broadcaster-strip.tsx — SERVER COMPONENT
import Image from 'next/image';

export type Broadcaster = { id: string; name: string; logo_url: string | null; site_url: string | null };

/** Partner / buyer logos. Falls back to a condensed wordmark when no logo. */
export function BroadcasterStrip({ label, items }: { label: string; items: Broadcaster[] }) {
  if (items.length === 0) return null;

  return (
    <section className="band-solid border-t border-primary/10 bg-[#0f0f0f] px-6 py-16 md:px-14">
      <div className="mx-auto w-full max-w-[1280px]">
        <p className="sec-tag">{label}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {items.map((b) => {
            const inner = b.logo_url ? (
              <Image
                src={b.logo_url}
                alt={b.name}
                width={110}
                height={36}
                className="h-9 w-auto opacity-60 transition-opacity duration-300 hover:opacity-100"
              />
            ) : (
              <span className="condensed border border-border bg-[#1a1a1a] px-4 py-2 text-[14px] tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                {b.name}
              </span>
            );

            return b.site_url ? (
              <a key={b.id} href={b.site_url} target="_blank" rel="noreferrer">
                {inner}
              </a>
            ) : (
              <div key={b.id}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
