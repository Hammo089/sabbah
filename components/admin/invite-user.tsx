// components/admin/invite-user.tsx
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { inviteUser, cancelInvitation } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import type { AppRoleEnum } from '@/types/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ROLES: AppRoleEnum[] = ['admin', 'editor', 'b2b_client', 'viewer', 'super_admin'];

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
      {label}
    </Button>
  );
}

export function InviteUser({
  pending,
  labels,
}: {
  pending: { email: string; role: string; created_at: string }[];
  labels: { invite: string; hint: string; pending: string; cancel: string; invited: string };
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(inviteUser, null);
  const [list, setList] = React.useState(pending);
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(labels.invited);
      formRef.current?.reset();
    } else {
      toast.error(state.error);
    }
  }, [state, labels.invited]);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium">{labels.invite}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{labels.hint}</p>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input name="email" type="email" required dir="ltr" placeholder="name@sabbah.com" />
        </div>

        <div className="w-44 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Role</Label>
          <select
            name="role"
            defaultValue="editor"
            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-background">
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <SubmitBtn label={labels.invite} />
      </form>

      {list.length > 0 && (
        <div className="mt-6">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{labels.pending}</p>
          <ul className="mt-3 space-y-1.5">
            {list.map((i) => (
              <li
                key={i.email}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm" dir="ltr">
                  {i.email}
                  <span className="ms-2 rounded bg-primary/15 px-1.5 py-0.5 text-[0.65rem] text-primary">
                    {i.role.replace('_', ' ')}
                  </span>
                </span>

                <button
                  type="button"
                  disabled={isPending}
                  aria-label={labels.cancel}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await cancelInvitation(i.email);
                      if (!res.ok) toast.error(res.error);
                      else setList((prev) => prev.filter((x) => x.email !== i.email));
                    })
                  }
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
