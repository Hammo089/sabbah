// components/site/home/stats-bar.tsx — SERVER COMPONENT
import { cn } from '@/lib/utils';

export function StatsBar({
  stats,
}: {
  stats: { value: string; sup?: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 border-y border-primary/10 bg-card px-6 py-8 md:grid-cols-4 md:px-14">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            'px-4 py-3 text-center',
            i < stats.length - 1 && 'md:border-e md:border-primary/10',
          )}
        >
          <p className="condensed text-[50px] leading-none text-primary">
            {s.value}
            {s.sup && <sup className="text-[24px]">{s.sup}</sup>}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
