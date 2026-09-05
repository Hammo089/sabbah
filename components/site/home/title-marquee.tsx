// components/site/home/title-marquee.tsx — SERVER COMPONENT
/** The gold band of title names under the stats bar. */
export function TitleMarquee({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const loop = [...names, ...names];

  return (
    <div className="overflow-hidden whitespace-nowrap bg-primary py-5">
      <div className="inline-flex animate-marquee-x hover:[animation-play-state:paused]">
        {loop.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="condensed px-9 text-[15px] tracking-[0.28em] text-primary-foreground"
          >
            {name}
            <span className="ps-9 text-[9px]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
