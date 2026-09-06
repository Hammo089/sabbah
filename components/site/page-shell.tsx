// components/site/page-shell.tsx — SERVER COMPONENT
export function PageShell({
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
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
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
      {children}
    </main>
  );
}
