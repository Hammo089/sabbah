// components/admin/legacy-manager.tsx
'use client';

import * as React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveLegacy, deleteLegacy } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/image-upload';
import { cn } from '@/lib/utils';

export type LegacyRow = {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  video_url: string | null;
  poster_url: string | null;
  year: number | null;
  is_published: boolean;
  sort_order: number;
};

const LANGS = ['ar', 'en', 'fr'] as const;

function Row({
  row,
  labels,
  upload,
  onDeleted,
}: {
  row: LegacyRow | null;
  labels: { save: string; saved: string; remove: string };
  upload: React.ComponentProps<typeof ImageUpload>['dict'] & { poster: string };
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [tab, setTab] = React.useState<(typeof LANGS)[number]>('ar');
  const formRef = React.useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await saveLegacy(null, formData);
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

      <div className="flex gap-1 border-b border-border pb-3">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={cn(
              'rounded px-3 py-1.5 text-xs uppercase tracking-widest transition-colors',
              tab === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {LANGS.map((l) => (
        <div key={l} className={cn('space-y-3', tab === l ? 'block' : 'hidden')}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title ({l})</Label>
            <Input name={`title_${l}`} defaultValue={row?.title[l] ?? ''} dir={l === 'ar' ? 'rtl' : 'ltr'} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description ({l})</Label>
            <textarea
              name={`description_${l}`}
              defaultValue={row?.description[l] ?? ''}
              dir={l === 'ar' ? 'rtl' : 'ltr'}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-24 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Input name="year" type="number" defaultValue={row?.year ?? ''} dir="ltr" />
        </div>
        <div className="min-w-[14rem] flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Video URL</Label>
          <Input name="video_url" type="url" defaultValue={row?.video_url ?? ''} dir="ltr" />
        </div>
        <div className="w-44">
          <ImageUpload
            name="poster_url"
            bucket="legacy"
            defaultValue={row?.poster_url}
            label={upload.poster}
            aspect="wide"
            dict={upload}
          />
        </div>
        <div className="w-20 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Order</Label>
          <Input name="sort_order" type="number" defaultValue={row?.sort_order ?? 0} dir="ltr" />
        </div>

        <label className="flex h-11 cursor-pointer items-center gap-2.5">
          <Switch name="is_published" defaultChecked={row?.is_published ?? true} />
          <span className="text-sm">Published</span>
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
                const res = await deleteLegacy(row.id);
                if (!res.ok) toast.error(res.error);
                else onDeleted?.();
              })
            }
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </form>
  );
}

export function LegacyManager({
  rows,
  labels,
  upload,
}: {
  rows: LegacyRow[];
  labels: { save: string; saved: string; remove: string; add: string };
  upload: React.ComponentProps<typeof ImageUpload>['dict'] & { poster: string };
}) {
  const [items, setItems] = React.useState(rows);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-primary">{labels.add}</p>
        <Row row={null} labels={labels} upload={upload} />
      </div>

      {items.map((row) => (
        <Row
          key={row.id}
          row={row}
          labels={labels}
          upload={upload}
          onDeleted={() => setItems((prev) => prev.filter((r) => r.id !== row.id))}
        />
      ))}
    </div>
  );
}
