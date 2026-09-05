// components/admin/sign-out-button.tsx
'use client';

import * as React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from '@/app/[lang]/(auth)/login/actions';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function SignOutButton({ lang, label }: { lang: Locale; label: string }) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOut(lang))}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md border border-border',
        'text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4 rtl:rotate-180" />}
    </button>
  );
}
