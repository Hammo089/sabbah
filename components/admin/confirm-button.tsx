// components/admin/confirm-button.tsx
'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A destructive control that asks first.
 *
 * Every delete in the admin panel was a single unguarded click — one slip and a
 * licence with its fees and contract reference, or a whole news item, was gone
 * with no undo. This arms in place rather than opening a modal: the first click
 * turns the control into a confirm/cancel pair, so the confirming click lands
 * somewhere the pointer was not already resting.
 *
 * It disarms on a 4-second timeout and on outside click, so an armed button
 * never sits waiting to catch an unrelated click later.
 */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  cancelLabel,
  className,
  children,
  disabled,
}: {
  onConfirm: () => void;
  /** Accessible name for the resting state — required: these are icon buttons. */
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [armed, setArmed] = React.useState(false);
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!armed) return;

    const timer = window.setTimeout(() => setArmed(false), 4000);
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setArmed(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setArmed(false);

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [armed]);

  if (armed) {
    return (
      <span ref={wrapRef} className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setArmed(false);
            onConfirm();
          }}
          className="inline-flex items-center gap-1 rounded bg-destructive px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-destructive-foreground"
        >
          <AlertTriangle className="size-3" />
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="rounded px-2 py-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          {cancelLabel}
        </button>
      </span>
    );
  }

  return (
    <span ref={wrapRef} className="inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => setArmed(true)}
        className={className}
      >
        {children}
      </button>
    </span>
  );
}
