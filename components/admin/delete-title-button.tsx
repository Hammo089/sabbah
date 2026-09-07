// components/admin/delete-title-button.tsx
'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { deleteTitle } from '@/app/[lang]/admin/(dashboard)/title-actions';
import { ConfirmButton } from '@/components/admin/confirm-button';

/**
 * `deleteTitle` existed, was guarded and revalidated — and was imported
 * nowhere. Titles could be created and edited but never removed from the
 * admin, so the operator had to go into Supabase to delete one.
 */
export function DeleteTitleButton({
  id,
  title,
  labels,
}: {
  id: string;
  title: string;
  labels: { delete: string; confirmDelete: string; cancel: string };
}) {
  const [pending, start] = React.useTransition();

  return (
    <ConfirmButton
      label={`${labels.delete} — ${title}`}
      confirmLabel={labels.confirmDelete}
      cancelLabel={labels.cancel}
      disabled={pending}
      className="inline-flex h-8 items-center rounded-md px-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      onConfirm={() =>
        start(async () => {
          const res = await deleteTitle({ id });
          if (!res.ok) toast.error(res.error);
          // No optimistic removal: deleteTitle revalidates the layout, so the
          // row disappears with the server's own list rather than this one
          // guessing and drifting from it.
        })
      }
    >
      <Trash2 className="size-3.5" />
    </ConfirmButton>
  );
}
