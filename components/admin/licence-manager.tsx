// components/admin/licence-manager.tsx
'use client';

import * as React from 'react';
import { Loader2, Plus, Trash2, AlertTriangle, BellOff, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { saveLicence, deleteLicence, acknowledgeReminder } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type LicenceRow = {
  id: string;
  series_id: string | null;
  licensee_id: string | null;
  licensee_name: string;
  territory: string[] | null;
  rights: string[] | null;
  drm: string;
  status: string;
  exclusivity: boolean;
  signed_on: string | null;
  starts_on: string | null;
  ends_on: string | null;
  reminder_days: number;
  reminder_ack: boolean;
  fee_usd: number | null;
  currency: string;
  contract_ref: string | null;
  notes: string | null;
  titleLabel: string;
  daysLeft: number | null;
};

type Option = { id: string; label: string };

const STATUSES = ['available', 'optioned', 'licensed', 'expired', 'withdrawn'];
const DRMS = ['widevine', 'fairplay', 'playready', 'none'];

type Dict = {
  save: string; saved: string; remove: string; add: string; edit: string; cancel: string;
  title: string; company: string; otherCompany: string; signed: string; from: string; to: string;
  remind: string; days: string; fee: string; territory: string; rights: string; contract: string;
  notes: string; exclusive: string; status: string; expiresIn: string; expired: string;
  dismiss: string; noLicences: string; endBeforeStart: string; titleRequired: string;
};

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function LicenceForm({
  row,
  titles,
  companies,
  dict,
  onDone,
}: {
  row: LicenceRow | null;
  titles: Option[];
  companies: Option[];
  dict: Dict;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await saveLicence(null, formData);
      if (!res.ok) {
        toast.error(
          res.error === 'END_BEFORE_START' ? dict.endBeforeStart
          : res.error === 'TITLE_REQUIRED' ? dict.titleRequired
          : res.error,
        );
        return;
      }
      toast.success(dict.saved);
      if (!row) formRef.current?.reset();
      onDone?.();
    });
  }

  return (
    <form ref={formRef} action={submit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={dict.title}>
          <select name="series_id" defaultValue={row?.series_id ?? ''} required
            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="" className="bg-background">—</option>
            {titles.map((t) => (
              <option key={t.id} value={t.id} className="bg-background">{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label={dict.company}>
          <select name="licensee_id" defaultValue={row?.licensee_id ?? ''}
            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="" className="bg-background">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="bg-background">{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label={dict.otherCompany}>
          <Input name="licensee_name" defaultValue={row?.licensee_name ?? ''} required />
        </Field>

        <Field label={dict.signed}>
          <Input name="signed_on" type="date" defaultValue={row?.signed_on ?? ''} dir="ltr" />
        </Field>
        <Field label={dict.from}>
          <Input name="starts_on" type="date" defaultValue={row?.starts_on ?? ''} dir="ltr" />
        </Field>
        <Field label={dict.to}>
          <Input name="ends_on" type="date" defaultValue={row?.ends_on ?? ''} dir="ltr" />
        </Field>

        <Field label={`${dict.remind} (${dict.days})`}>
          <Input name="reminder_days" type="number" min={0} max={365}
            defaultValue={row?.reminder_days ?? 30} dir="ltr" />
        </Field>

        <Field label={dict.status}>
          <select name="status" defaultValue={row?.status ?? 'licensed'}
            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {STATUSES.map((s) => <option key={s} value={s} className="bg-background">{s}</option>)}
          </select>
        </Field>

        <Field label="DRM">
          <select name="drm" defaultValue={row?.drm ?? 'widevine'}
            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {DRMS.map((d) => <option key={d} value={d} className="bg-background">{d}</option>)}
          </select>
        </Field>

        <Field label={dict.territory}>
          <Input name="territory" defaultValue={(row?.territory ?? []).join(', ')} dir="ltr" placeholder="AE, SA, LB" />
        </Field>
        <Field label={dict.rights}>
          <Input name="rights" defaultValue={(row?.rights ?? []).join(', ')} dir="ltr" placeholder="SVOD, AVOD" />
        </Field>
        <Field label={dict.contract}>
          <Input name="contract_ref" defaultValue={row?.contract_ref ?? ''} dir="ltr" />
        </Field>

        <Field label={dict.fee}>
          <Input name="fee_usd" type="number" step="0.01" min={0} defaultValue={row?.fee_usd ?? ''} dir="ltr" />
        </Field>
        <Field label="Currency">
          <Input name="currency" maxLength={3} defaultValue={row?.currency ?? 'USD'} dir="ltr" />
        </Field>

        <label className="flex h-11 cursor-pointer items-center gap-2.5 self-end">
          <Switch name="exclusivity" defaultChecked={row?.exclusivity ?? false} />
          <span className="text-sm">{dict.exclusive}</span>
        </label>
      </div>

      <Field label={dict.notes}>
        <textarea name="notes" defaultValue={row?.notes ?? ''} rows={2}
          className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" variant="gold" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : row ? null : <Plus />}
          {dict.save}
        </Button>
        {row && onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X />
            {dict.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}

export function LicenceManager({
  rows,
  titles,
  companies,
  dict,
}: {
  rows: LicenceRow[];
  titles: Option[];
  companies: Option[];
  dict: Dict;
}) {
  const [items, setItems] = React.useState(rows);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const alerts = items.filter(
    (r) => r.daysLeft !== null && !r.reminder_ack && ['licensed', 'optioned'].includes(r.status) && r.daysLeft <= r.reminder_days,
  );

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <section className="rounded-lg border border-amber-500/40 bg-amber-500/[0.06] p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-500">
            <AlertTriangle className="size-4" />
            {alerts.length}
          </p>

          <ul className="mt-4 space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/25 px-3 py-2">
                <span className="text-sm">
                  <strong>{a.titleLabel}</strong>
                  <span className="mx-2 text-muted-foreground">·</span>
                  {a.licensee_name}
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className={cn('font-medium', (a.daysLeft ?? 0) < 0 ? 'text-destructive' : 'text-amber-500')}>
                    {(a.daysLeft ?? 0) < 0
                      ? dict.expired
                      : dict.expiresIn.replace('{n}', String(a.daysLeft))}
                  </span>
                </span>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await acknowledgeReminder(a.id);
                      if (!res.ok) toast.error(res.error);
                      else setItems((prev) => prev.map((r) => (r.id === a.id ? { ...r, reminder_ack: true } : r)));
                    })
                  }
                  className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <BellOff className="size-3.5" />
                  {dict.dismiss}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {adding ? (
        <LicenceForm row={null} titles={titles} companies={companies} dict={dict} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="gold" size="sm" onClick={() => setAdding(true)}>
          <Plus />
          {dict.add}
        </Button>
      )}

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{dict.noLicences}</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) =>
            editing === row.id ? (
              <LicenceForm key={row.id} row={row} titles={titles} companies={companies} dict={dict} onDone={() => setEditing(null)} />
            ) : (
              <div key={row.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="min-w-[12rem] flex-1">
                  <p className="text-sm font-medium">{row.titleLabel}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.licensee_name}</p>
                </div>

                <div className="text-xs text-muted-foreground" dir="ltr">
                  {row.starts_on ?? '—'} → {row.ends_on ?? '—'}
                </div>

                <span className="rounded bg-muted px-2 py-0.5 text-xs">{row.status}</span>

                {row.daysLeft !== null && (
                  <span className={cn('text-xs', row.daysLeft < 0 ? 'text-destructive' : row.daysLeft <= row.reminder_days ? 'text-amber-500' : 'text-muted-foreground')}>
                    {row.daysLeft < 0 ? dict.expired : dict.expiresIn.replace('{n}', String(row.daysLeft))}
                  </span>
                )}

                {row.fee_usd != null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {row.currency} {Number(row.fee_usd).toLocaleString()}
                  </span>
                )}

                <div className="ms-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(row.id)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await deleteLicence(row.id);
                        if (!res.ok) toast.error(res.error);
                        else setItems((prev) => prev.filter((r) => r.id !== row.id));
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
