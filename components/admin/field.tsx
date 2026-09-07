// components/admin/field.tsx
'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * A labelled form field whose label is actually ASSOCIATED with its control.
 *
 * The admin panel had a `Field` helper copied into several files, each of which
 * rendered <Label> as a SIBLING of the input with no htmlFor and no id. A
 * screen reader announces those inputs as unnamed, and clicking the label does
 * nothing. Fixing it at every call site would mean threading an id through a
 * hundred fields by hand, so the id is generated here and injected into the
 * child: every existing `<Field label="…"><Input …/></Field>` becomes correct
 * without touching the call sites.
 *
 * A child that already carries its own `id` keeps it — the label follows the
 * child rather than overwriting it.
 */
export function Field({
  label,
  children,
  className,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
  required?: boolean;
}) {
  const generatedId = React.useId();
  const hintId = hint ? `${generatedId}-hint` : undefined;

  // Only a single element child can receive the id; anything else (a fragment,
  // a group of radios) falls back to wrapping, which associates by containment.
  const child = React.isValidElement(children) ? children : null;

  const childId =
    (child?.props as { id?: string } | undefined)?.id ?? (child ? generatedId : undefined);

  const control = child
    ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id: childId,
        ...(hintId ? { 'aria-describedby': hintId } : {}),
        ...(required ? { required: true, 'aria-required': true } : {}),
      })
    : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={childId} className="text-xs text-muted-foreground">
        {label}
        {required && (
          <span aria-hidden className="ms-1 text-primary">
            *
          </span>
        )}
      </Label>
      {control}
      {hint && (
        <p id={hintId} className="text-[0.7rem] leading-snug text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  );
}
