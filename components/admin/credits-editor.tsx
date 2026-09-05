// components/admin/credits-editor.tsx
'use client';

import * as React from 'react';
import { Loader2, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { addCredit, removeCredit } from '@/app/[lang]/admin/(dashboard)/title-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

type Person = { id: string; slug: string; name: string; photo_url: string | null };
type Credit = { id: string; kind: 'cast' | 'crew'; role: string | null; character: string; name: string };

export function CreditsEditor({
  seriesId,
  lang,
  dict,
}: {
  seriesId: string;
  lang: Locale;
  dict: { cast: string; crew: string; addPerson: string; searchPerson: string; character: string; role: string; remove: string; noCredits: string };
}) {
  const [credits, setCredits] = React.useState<Credit[]>([]);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Person[]>([]);
  const [kind, setKind] = React.useState<'cast' | 'crew'>('cast');
  const [role, setRole] = React.useState('');
  const [character, setCharacter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isPending, startTransition] = React.useTransition();

  const debounced = useDebouncedValue(query, 220);

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/admin/credits?seriesId=${seriesId}&lang=${lang}`);
    const data = res.ok ? await res.json() : { credits: [] };
    setCredits(data.credits ?? []);
    setLoading(false);
  }, [seriesId, lang]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/admin/people?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((d: { people?: Person[] }) => setResults(d.people ?? []))
      .catch(() => setResults([]));
    return () => controller.abort();
  }, [debounced, lang]);

  function attach(person: Person) {
    startTransition(async () => {
      const res = await addCredit({
        seriesId,
        personId: person.id,
        kind,
        role: kind === 'crew' ? role : undefined,
        characterAr: kind === 'cast' ? character : undefined,
        characterEn: kind === 'cast' ? character : undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setQuery('');
      setResults([]);
      setCharacter('');
      setRole('');
      await load();
    });
  }

  function detach(creditId: string) {
    startTransition(async () => {
      const res = await removeCredit(creditId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCredits((prev) => prev.filter((c) => c.id !== creditId));
    });
  }

  const cast = credits.filter((c) => c.kind === 'cast');
  const crew = credits.filter((c) => c.kind === 'crew');

  return (
    <section className="mb-24 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium">{dict.addPerson}</h2>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {(['cast', 'crew'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                'rounded px-3 py-1.5 text-xs transition-colors',
                kind === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {k === 'cast' ? dict.cast : dict.crew}
            </button>
          ))}
        </div>

        {kind === 'cast' ? (
          <Input
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder={dict.character}
            className="h-9 w-40"
          />
        ) : (
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={dict.role}
            className="h-9 w-40"
          />
        )}

        <div className="relative min-w-[16rem] flex-1">
          <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPerson}
            className="h-9 ps-9"
          />

          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => attach(p)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
                  >
                    <Plus className="size-3.5 text-primary" />
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">…</p>
      ) : credits.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{dict.noCredits}</p>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {([[dict.cast, cast], [dict.crew, crew]] as const).map(([label, list]) =>
            list.length === 0 ? null : (
              <div key={label}>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <ul className="mt-3 space-y-1.5">
                  {list.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <span className="min-w-0 text-sm">
                        {c.name}
                        {(c.character || c.role) && (
                          <span className="ms-2 text-xs text-muted-foreground">{c.character || c.role}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => detach(c.id)}
                        aria-label={dict.remove}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
