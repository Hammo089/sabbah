// components/site/hero/hero-skeleton.tsx — SERVER COMPONENT (streaming fallback)
export function HeroSkeleton() {
  return (
    <section className="grain relative min-h-[92svh] w-full overflow-hidden bg-[#000000]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-16 px-6 py-24 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] xl:px-16">
        <div className="space-y-6">
          <div className="h-3 w-32 animate-pulse rounded bg-primary/20" />
          <div className="h-16 w-[85%] animate-pulse rounded bg-neutral-800/70" />
          <div className="h-16 w-[70%] animate-pulse rounded bg-neutral-800/70" />
          <div className="h-16 w-[55%] animate-pulse rounded bg-neutral-800/50" />
          <div className="h-px w-40 bg-primary/30" />
          <div className="h-4 w-[60%] animate-pulse rounded bg-neutral-800/50" />
          <div className="flex gap-3 pt-4">
            <div className="h-12 w-44 animate-pulse rounded-md bg-primary/25" />
            <div className="h-12 w-44 animate-pulse rounded-md bg-neutral-800/60" />
          </div>
        </div>

        <div className="mask-fade-y hidden h-[78svh] grid-cols-3 gap-4 lg:grid">
          {Array.from({ length: 3 }).map((_, col) => (
            <div key={col} className="flex flex-col gap-4" style={{ marginTop: col === 1 ? 40 : col === 2 ? 16 : 0 }}>
              {Array.from({ length: 4 }).map((__, row) => (
                <div
                  key={row}
                  className="aspect-[2/3] w-full animate-pulse rounded-md bg-neutral-900 ring-1 ring-white/[0.05]"
                  style={{ animationDelay: `${(col * 4 + row) * 90}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
