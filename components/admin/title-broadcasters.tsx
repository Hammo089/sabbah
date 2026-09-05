// components/admin/title-broadcasters.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleTitleBroadcaster } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import { cn } from '@/lib/utils';

export function TitleBroadcasters({
  seriesId,
  all,
  attachedIds,
  labels,
}: {
  seriesId: string;
  all: { id: string; name: string }[];
  attachedIds: string[];
  labels: { title: string; empty: string };
}) {
  const [attached, setAttached] = React.useState(new Set(attachedIds));
  const [isPending, startTransition] = React.useTransition();

  function toggle(id: string) {
    const next = new Set(attached);
    const willAttach = !next.has(id);
    if (willAttach) next.add(id);
    else next.delete(id);
    setAttached(next);

    startTransition(async () => {
      const res = await toggleTitleBroadcaster({ seriesId, broadcasterId: id, attach: willAttach });
      if (!res.ok) {
        // roll back on failure
        setAttached((prev) => {
          const rb = new Set(prev);
          if (willAttach) rb.delete(id);
          else rb.add(id);
          return rb;
        });
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="mb-8 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">{labels.title}</h2>
        {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      {all.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {all.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs transition-colors',
                attached.has(b.id)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
