'use client';

// components/admin/create-user.tsx — CLIENT COMPONENT
import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Copy, KeyRound, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { createUserDirect } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import type { AppRoleEnum } from '@/types/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ROLES: AppRoleEnum[] = ['admin', 'editor', 'b2b_client', 'viewer', 'super_admin'];

type Result = ActionResult & { password?: string };

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
      {label}
    </Button>
  );
}

/**
 * Creates the account immediately — no invitation, no waiting for the person to
 * sign up. The temporary password is returned once and shown here; it is never
 * stored on our side, so if it is lost the account needs a new one.
 */
export function CreateUser({
  labels,
}: {
  labels: {
    title: string;
    hint: string;
    email: string;
    fullName: string;
    role: string;
    password: string;
    passwordHint: string;
    create: string;
    created: string;
    copy: string;
    copied: string;
  };
}) {
  const [state, formAction] = useActionState<Result | null, FormData>(createUserDirect, null);
  const [copied, setCopied] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(labels.created);
      formRef.current?.reset();
    } else {
      toast.error(state.error);
    }
  }, [state, labels.created]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('clipboard');
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="size-4 text-primary" />
        {labels.title}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{labels.hint}</p>

      <form ref={formRef} action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{labels.email} *</Label>
          <Input name="email" type="email" required dir="ltr" placeholder="name@sabbah.com" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{labels.fullName}</Label>
          <Input name="full_name" maxLength={120} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{labels.role}</Label>
          <select
            name="role"
            defaultValue="editor"
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-background">
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{labels.password}</Label>
          <Input name="password" type="text" minLength={10} maxLength={72} dir="ltr" autoComplete="off" />
          <p className="text-[0.7rem] text-muted-foreground/70">{labels.passwordHint}</p>
        </div>

        <div className="sm:col-span-2">
          <SubmitBtn label={labels.create} />
        </div>
      </form>

      {state?.ok && state.password && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-primary/35 bg-primary/[0.06] p-4">
          <KeyRound className="size-4 shrink-0 text-primary" />
          <code className="min-w-0 flex-1 select-all break-all font-mono text-sm" dir="ltr">
            {state.password}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={() => copy(state.password!)}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? labels.copied : labels.copy}
          </Button>
        </div>
      )}
    </section>
  );
}
