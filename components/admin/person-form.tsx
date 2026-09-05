// components/admin/person-form.tsx
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { savePerson } from '@/app/[lang]/admin/(dashboard)/title-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type PersonFormValues = {
  id?: string;
  slug: string;
  name: Record<string, string>;
  bio: Record<string, string>;
  photo_url: string | null;
  birth_year: number | null;
  nationality: string | null;
  is_published: boolean;
};

const LANGS = ['ar', 'en', 'fr'] as const;

function SaveBar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

export function PersonForm({
  values,
  labels,
}: {
  values: PersonFormValues;
  labels: { save: string; saved: string };
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(savePerson, null);
  const [tab, setTab] = React.useState<(typeof LANGS)[number]>('ar');

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(labels.saved);
    else toast.error(state.error);
  }, [state, labels.saved]);

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex gap-1 border-b border-border pb-3">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              className={cn(
                'rounded px-3 py-1.5 text-xs uppercase tracking-widest transition-colors',
                tab === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {LANGS.map((l) => (
          <div key={l} className={cn('space-y-4 pt-5', tab === l ? 'block' : 'hidden')}>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Name ({l})</Label>
              <Input name={`name_${l}`} defaultValue={values.name[l] ?? ''} dir={l === 'ar' ? 'rtl' : 'ltr'} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bio ({l})</Label>
              <textarea
                name={`bio_${l}`}
                defaultValue={values.bio[l] ?? ''}
                dir={l === 'ar' ? 'rtl' : 'ltr'}
                rows={4}
                className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Slug</Label>
          <Input name="slug" defaultValue={values.slug} dir="ltr" required pattern="[a-z0-9-]+" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Photo URL</Label>
          <Input name="photo_url" type="url" defaultValue={values.photo_url ?? ''} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Birth year</Label>
          <Input name="birth_year" type="number" defaultValue={values.birth_year ?? ''} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nationality (2 letters)</Label>
          <Input name="nationality" maxLength={2} defaultValue={values.nationality ?? ''} dir="ltr" />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <Switch name="is_published" defaultChecked={values.is_published} />
          <span className="text-sm">Published</span>
        </label>
      </section>

      <SaveBar label={labels.save} />
    </form>
  );
}
