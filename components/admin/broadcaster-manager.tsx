// components/admin/broadcaster-manager.tsx
'use client';

import * as React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveBroadcaster, deleteBroadcaster } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/image-upload';

export type BroadcasterRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  site_url: string | null;
  sort_order: number;
};

function Row({
  row,
  labels,
  upload,
  onDeleted,
}: {
  row: BroadcasterRow | null;
  labels: { save: string; saved: string; remove: string };
  upload: React.ComponentProps<typeof ImageUpload>['dict'] & { logo: string };
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await saveBroadcaster(null, formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(labels.saved);
        if (!row) formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={submit} className="rounded-lg border border-border bg-card p-4">
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input name="name" defaultValue={row?.name ?? ''} required />
        </div>

        <div className="w-36 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Slug</Label>
          <Input name="slug" defaultValue={row?.slug ?? ''} dir="ltr" required pattern="[a-z0-9-]+" />
        </div>

        <div className="w-40">
          <ImageUpload
            name="logo_url"
            bucket="broadcasters"
            defaultValue={row?.logo_url}
            label={upload.logo}
            aspect="wide"
            dict={upload}
          />
        </div>

        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Website</Label>
          <Input name="site_url" type="url" defaultValue={row?.site_url ?? ''} dir="ltr" />
        </div>

        <div className="w-20 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Order</Label>
          <Input name="sort_order" type="number" defaultValue={row?.sort_order ?? 0} dir="ltr" />
        </div>

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
                const res = await deleteBroadcaster(row.id);
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

export function BroadcasterManager({
  rows,
  labels,
  upload,
}: {
  rows: BroadcasterRow[];
  labels: { save: string; saved: string; remove: string; add: string };
  upload: React.ComponentProps<typeof ImageUpload>['dict'] & { logo: string };
}) {
  const [items, setItems] = React.useState(rows);

  return (
    <div className="space-y-4">
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
