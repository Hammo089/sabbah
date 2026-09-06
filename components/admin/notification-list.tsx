'use client';

// components/admin/notification-list.tsx — CLIENT COMPONENT
import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Bell, CheckCheck, CircleCheck, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { markNotification } from '@/app/[lang]/admin/(dashboard)/record-actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type NotifRow = {
  id: string;
  level: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

const ICON = { info: Info, success: CircleCheck, warning: AlertTriangle, danger: AlertTriangle };
const TONE = {
  info: 'text-primary',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-destructive',
};

export function NotificationList({
  rows,
  dict,
}: {
  rows: NotifRow[];
  dict: { markAll: string; empty: string };
}) {
  const [items, setItems] = React.useState(rows);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    setItems(rows);
  }, [rows]);

  const unread = items.filter((r) => !r.is_read).length;

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{dict.empty}</p>;
  }

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await markNotification(null);
              if (!res.ok) toast.error(res.error);
              else setItems((prev) => prev.map((r) => ({ ...r, is_read: true })));
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : <CheckCheck />}
          {dict.markAll}
        </Button>
      )}

      <div className="space-y-2">
        {items.map((row) => {
          const Icon = ICON[row.level] ?? Bell;

          const inner = (
            <div
              className={cn(
                'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                row.is_read ? 'border-border bg-card opacity-60' : 'border-primary/30 bg-primary/[0.04]',
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', TONE[row.level])} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.title}</p>
                {row.body && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.body}</p>}
                <p className="mt-2 text-[0.7rem] text-muted-foreground/70" dir="ltr">
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </div>

              {!row.is_read && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    start(async () => {
                      const res = await markNotification(row.id);
                      if (!res.ok) toast.error(res.error);
                      else setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: true } : r)));
                    });
                  }}
                  className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <CheckCheck className="size-4" />
                </button>
              )}
            </div>
          );

          return row.href ? (
            <Link key={row.id} href={row.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={row.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
