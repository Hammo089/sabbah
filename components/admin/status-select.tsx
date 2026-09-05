// components/admin/status-select.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setContentStatus } from '@/app/[lang]/admin/(dashboard)/actions';
import type { ContentStatusEnum } from '@/types/database.types';
import { cn } from '@/lib/utils';

const ORDER: ContentStatusEnum[] = ['draft', 'in_review', 'published', 'archived'];

const TONE: Record<ContentStatusEnum, string> = {
  draft: 'border-border text-muted-foreground',
  in_review: 'border-amber-500/40 text-amber-500',
  published: 'border-emerald-500/40 text-emerald-500',
  archived: 'border-border text-muted-foreground line-through',
};

export function StatusSelect({
  id,
  table,
  defaultValue,
  labels,
}: {
  id: string;
  table: 'series' | 'movies' | 'programs';
  defaultValue: ContentStatusEnum;
  labels: Record<ContentStatusEnum, string>;
}) {
  const [value, setValue] = React.useState<ContentStatusEnum>(defaultValue);
  const [isPending, startTransition] = React.useTransition();

  function onChange(next: ContentStatusEnum) {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const res = await setContentStatus({ table, id, status: next });
      if (!res.ok) {
        setValue(previous);
        toast.error(res.error === 'FORBIDDEN' ? 'Insufficient permissions.' : res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value as ContentStatusEnum)}
        className={cn(
          'h-8 rounded-md border bg-transparent px-2 text-xs transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          TONE[value],
        )}
      >
        {ORDER.map((s) => (
          <option key={s} value={s} className="bg-background text-foreground">
            {labels[s]}
          </option>
        ))}
      </select>
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
