'use client';

// components/admin/hero-picks.tsx — CLIENT COMPONENT
// Choose the titles that greet a visitor on the homepage.
//
// The same `is_featured_slider` flag as the toggle on each series row — but
// gathered onto one screen with the posters visible, because picking eight
// cards that look good together is a visual decision, not a checkbox on a list
// you have to page through.
import * as React from 'react';
import Image from 'next/image';
import { Check, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { setHeroPick } from '@/app/[lang]/admin/(dashboard)/season-actions';
import { cn } from '@/lib/utils';

export type PickCard = {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  picked: boolean;
};

export function HeroPicks({
  rows,
  dict,
}: {
  rows: PickCard[];
  dict: { title: string; hint: string; count: string; saved: string; empty: string };
}) {
  const [items, setItems] = React.useState(rows);
  const [pending, start] = React.useTransition();
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(rows);
  }, [rows]);

  const picked = items.filter((r) => r.picked).length;

  function toggle(row: PickCard) {
    setBusy(row.id);
    start(async () => {
      const next = !row.picked;
      const res = await setHeroPick(row.id, next);

      if (!res.ok) toast.error(res.error);
      else {
        setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, picked: next } : r)));
        toast.success(dict.saved);
      }
      setBusy(null);
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{dict.empty}</p>;
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Star className="size-4 text-primary" />
          {dict.title}
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {picked} {dict.count}
        </span>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{dict.hint}</p>

      <div className="mt-5 grid max-h-[28rem] grid-cols-3 gap-3 overflow-y-auto pe-1 sm:grid-cols-5 lg:grid-cols-8">
        {items.map((row) => (
          <button
            key={row.id}
            type="button"
            disabled={pending && busy === row.id}
            onClick={() => toggle(row)}
            title={row.title}
            className={cn(
              'group relative aspect-[2/3] overflow-hidden rounded-md bg-muted transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              row.picked
                ? 'ring-2 ring-primary'
                : 'opacity-45 ring-1 ring-border hover:opacity-90',
            )}
          >
            {row.posterUrl && (
              <Image src={row.posterUrl} alt="" fill sizes="120px" className="object-cover" />
            )}

            {row.picked && (
              <span className="absolute end-1 top-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            )}

            {busy === row.id && (
              <span className="absolute inset-0 grid place-items-center bg-black/60">
                <Loader2 className="size-4 animate-spin text-primary" />
              </span>
            )}

            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent p-1.5 text-[0.6rem] text-white">
              {row.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
