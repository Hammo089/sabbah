// components/site/legal-doc.tsx — SERVER COMPONENT
export function LegalDoc({
  sections,
  updatedLabel,
  updatedOn,
}: {
  sections: string[][];
  updatedLabel: string;
  updatedOn: string;
}) {
  return (
    <div className="mt-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
        {updatedLabel}: {updatedOn}
      </p>

      <ol className="mt-10 max-w-3xl space-y-10">
        {sections.map((section, i) => (
          <li key={section[0]} className="border-s border-border ps-6">
            <h2 className="text-display text-lg font-light text-foreground">
              <span className="me-3 text-sm text-primary">{String(i + 1).padStart(2, '0')}</span>
              {section[0]}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section[1]}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
