// components/admin/active-toggle.tsx
'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { setUserActive } from '@/app/[lang]/admin/(dashboard)/actions';
import { cn } from '@/lib/utils';

/**
 * The account revocation switch.
 *
 * `is_active` is the field `hasRole` checks, so flipping it off is what
 * actually removes a person's access — role alone does not. Rendered as a
 * two-state pill rather than a checkbox because the current state has to be
 * readable at a glance down a long table.
 */
export function ActiveToggle({
  userId,
  defaultValue,
  isSelf,
  labels,
}: {
  userId: string;
  defaultValue: boolean;
  isSelf: boolean;
  labels: { active: string; inactive: string; deactivate: string; activate: string };
}) {
  const [active, setActive] = React.useState(defaultValue);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    setActive(defaultValue);
  }, [defaultValue]);

  const next = !active;

  return (
    <button
      type="button"
      disabled={pending || isSelf}
      aria-pressed={active}
      aria-label={next ? labels.activate : labels.deactivate}
      title={isSelf ? undefined : next ? labels.activate : labels.deactivate}
      onClick={() =>
        start(async () => {
          // Optimistic: the row flips immediately and rolls back on refusal, so
          // a slow round-trip does not read as a dead control.
          setActive(next);
          const res = await setUserActive({ userId, isActive: next });
          if (!res.ok) {
            setActive(!next);
            toast.error(res.error);
          }
        })
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors',
        active
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-border bg-muted/50 text-muted-foreground',
        (pending || isSelf) && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground/50')}
      />
      {active ? labels.active : labels.inactive}
    </button>
  );
}
