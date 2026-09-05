// components/admin/role-select.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setUserRole } from '@/app/[lang]/admin/(dashboard)/actions';
import type { AppRoleEnum } from '@/types/database.types';
import { cn } from '@/lib/utils';

const ROLES: AppRoleEnum[] = ['super_admin', 'admin', 'editor', 'b2b_client', 'viewer'];

export function RoleSelect({
  userId,
  defaultValue,
  isSelf,
  messages,
}: {
  userId: string;
  defaultValue: AppRoleEnum;
  isSelf: boolean;
  messages: { updated: string; failed: string };
}) {
  const [value, setValue] = React.useState<AppRoleEnum>(defaultValue);
  const [isPending, startTransition] = React.useTransition();

  // A super_admin demoting himself can lock everyone out — the server refuses
  // it too, this only removes the footgun from the UI.
  const locked = isSelf && value === 'super_admin';

  function onChange(next: AppRoleEnum) {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const res = await setUserRole({ userId, role: next });
      if (!res.ok) {
        setValue(previous);
        toast.error(messages.failed, {
          description: res.error === 'CANNOT_DEMOTE_SELF' ? undefined : res.error,
        });
        return;
      }
      toast.success(messages.updated);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={isPending || locked}
        onChange={(e) => onChange(e.target.value as AppRoleEnum)}
        className={cn(
          'h-8 rounded-md border border-input bg-transparent px-2 text-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          value === 'super_admin' && 'border-primary/50 text-primary',
        )}
      >
        {ROLES.map((r) => (
          <option key={r} value={r} className="bg-background text-foreground">
            {r.replace('_', ' ')}
          </option>
        ))}
      </select>
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
