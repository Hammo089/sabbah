// components/admin/settings-form.tsx
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveSettings } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import type { SiteSettings } from '@/lib/queries/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

export function SettingsForm({
  values,
  labels,
}: {
  values: SiteSettings;
  labels: { save: string; saved: string };
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveSettings, null);

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(labels.saved);
    else toast.error(state.error);
  }, [state, labels.saved]);

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      <section className="space-y-5 rounded-lg border border-border bg-card p-5">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">Homepage</p>

        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm">News ticker visible on every page</span>
          <Switch name="ticker_enabled" defaultChecked={values.ticker_enabled} />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm">70th anniversary film section</span>
          <Switch name="anniversary_enabled" defaultChecked={values.anniversary_enabled} />
        </label>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Anniversary YouTube ID</Label>
          <Input name="anniversary_youtube" defaultValue={values.anniversary_youtube} dir="ltr" />
          <p className="text-xs text-muted-foreground">
            From youtube.com/watch?v=<strong>R0J7ypYwiDI</strong> use only the part after v=
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hero background image URL</Label>
          <Input name="hero_backdrop_url" type="url" defaultValue={values.hero_backdrop_url ?? ''} dir="ltr" />
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 sm:grid-cols-4">
        <p className="col-span-full text-[0.65rem] uppercase tracking-[0.2em] text-primary">Stats bar</p>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Years</Label>
          <Input name="stat_years" defaultValue={values.stat_years} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Productions</Label>
          <Input name="stat_productions" defaultValue={values.stat_productions} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Offices</Label>
          <Input name="stat_offices" defaultValue={values.stat_offices} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Partners</Label>
          <Input name="stat_partners" defaultValue={values.stat_partners} dir="ltr" />
        </div>
      </section>

      <SaveBtn label={labels.save} />
    </form>
  );
}
