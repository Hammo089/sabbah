// components/site/home/stats-bar.tsx — SERVER COMPONENT (CountUp is the client leaf)
import { CountUpText } from '@/components/motion/count-up';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export function StatsBar({
  stats,
}: {
  stats: { value: string; sup?: string; label: string }[];
}) {
  return (
    <div className="band-solid grid grid-cols-2 border-y border-primary/10 bg-card px-6 py-8 md:grid-cols-4 md:px-14">
      {stats.map((s, i) => (
        <Reveal
          key={s.label}
          delay={i * 0.08}
          className={cn(
            'px-4 py-3 text-center',
            i < stats.length - 1 && 'md:border-e md:border-primary/10',
          )}
        >
          <p className="condensed text-[50px] leading-none text-primary">
            <CountUpText value={s.value} />
            {s.sup && <sup className="text-[24px]">{s.sup}</sup>}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {s.label}
          </p>
        </Reveal>
      ))}
    </div>
  );
}
