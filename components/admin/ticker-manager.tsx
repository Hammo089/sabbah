// components/admin/ticker-manager.tsx
'use client';

import * as React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  saveTicker,
  deleteTicker,
  saveTickerChrome,
} from '@/app/[lang]/admin/(dashboard)/settings-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export type TickerRow = {
  id: string;
  message: Record<string, string>;
  link_url: string | null;
  priority: number;
  is_active: boolean;
};

function Row({
  row,
  labels,
  onDeleted,
}: {
  row: TickerRow | null;
  labels: { save: string; saved: string; remove: string };
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await saveTicker(null, formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(labels.saved);
        if (!row) formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={submit} className="space-y-4 rounded-lg border border-border bg-card p-5">
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="grid gap-4 md:grid-cols-3">
        {(['ar', 'en', 'fr'] as const).map((l) => (
          <div key={l} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Message ({l})</Label>
            <Input
              name={`message_${l}`}
              defaultValue={row?.message[l] ?? ''}
              dir={l === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Link (optional)</Label>
          <Input name="link_url" type="url" defaultValue={row?.link_url ?? ''} dir="ltr" />
        </div>

        <div className="w-24 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Input name="priority" type="number" defaultValue={row?.priority ?? 0} dir="ltr" />
        </div>

        <label className="flex h-11 cursor-pointer items-center gap-2.5">
          <Switch name="is_active" defaultChecked={row?.is_active ?? true} />
          <span className="text-sm">Active</span>
        </label>

        <Button type="submit" variant="gold" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : row ? null : <Plus />}
          {labels.save}
        </Button>

        {row && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteTicker(row.id);
                if (!res.ok) toast.error(res.error);
                else onDeleted?.();
              })
            }
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 />
            {labels.remove}
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Visibility + scroll speed, on the page staff actually open when the strip is
 * running too fast. Writes the same two columns the Appearance page writes.
 */
export function TickerControls({
  enabled,
  speed,
  dict,
}: {
  enabled: boolean;
  speed: number;
  dict: { visible: string; speed: string; hint: string; save: string; saved: string };
}) {
  const [value, setValue] = React.useState(speed);
  const [isPending, startTransition] = React.useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await saveTickerChrome(null, formData);
      if (!res.ok) toast.error(res.error);
      else toast.success(dict.saved);
    });
  }

  return (
    <form action={submit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="text-sm">{dict.visible}</span>
        <Switch name="ticker_enabled" defaultChecked={enabled} />
      </label>

      <div className="space-y-1.5 border-t border-border pt-5">
        <Label className="text-xs text-muted-foreground">{dict.speed}</Label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={240}
            step={2}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-[hsl(var(--primary))]"
            aria-label={dict.speed}
          />
          <Input
            name="ticker_speed"
            type="number"
            min={10}
            max={240}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            dir="ltr"
            className="w-20 text-center"
          />
        </div>
        <p className="text-[0.7rem] text-muted-foreground/70">{dict.hint}</p>
      </div>

      <Button type="submit" variant="gold" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : null}
        {dict.save}
      </Button>
    </form>
  );
}

export function TickerManager({
  rows,
  labels,
}: {
  rows: TickerRow[];
  labels: { save: string; saved: string; remove: string; add: string };
}) {
  const [items, setItems] = React.useState(rows);

  // Keep the list in step with the server after a save (see licence-manager).
  React.useEffect(() => {
    setItems(rows);
  }, [rows]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-primary">{labels.add}</p>
        <Row row={null} labels={labels} />
      </div>

      {items.map((row) => (
        <Row
          key={row.id}
          row={row}
          labels={labels}
          onDeleted={() => setItems((prev) => prev.filter((r) => r.id !== row.id))}
        />
      ))}
    </div>
  );
}
