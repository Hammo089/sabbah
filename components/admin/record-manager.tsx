'use client';

// components/admin/record-manager.tsx — CLIENT COMPONENT
// The shared CRUD screen behind Tags, Library, Master Scenes, News & Press and
// Social. One audited form, described by a field list, instead of five
// near-identical editors that drift apart.
import * as React from 'react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { toast } from 'sonner';
import { saveRecord, deleteRecord } from '@/app/[lang]/admin/(dashboard)/record-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type FieldType = 'text' | 'number' | 'url' | 'date' | 'textarea' | 'select' | 'switch' | 'color' | 'i18n';

export type Field = {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  span?: 1 | 2 | 3;
  required?: boolean;
  dir?: 'ltr' | 'rtl';
};

export type RecordRow = {
  id: string;
  /** what the collapsed row shows */
  primary: string;
  secondary?: string | null;
  badge?: string | null;
  /** raw values keyed by field name; i18n fields hold a { ar, en, fr } object */
  values: Record<string, unknown>;
};

export type ManagerDict = {
  add: string;
  save: string;
  saved: string;
  remove: string;
  cancel: string;
  empty: string;
  edit: string;
  delete: string;
  confirmDelete: string;
};

const INPUT =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function FieldInput({ field, value }: { field: Field; value: unknown }) {
  const common = { name: field.name, dir: field.dir, placeholder: field.placeholder };

  switch (field.type) {
    case 'i18n': {
      const group = (value ?? {}) as Record<string, string>;
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {(['ar', 'en', 'fr'] as const).map((l) => (
            <div key={l} className="space-y-1.5">
              <Label className="text-[0.7rem] text-muted-foreground">
                {field.label} ({l})
              </Label>
              <Input
                name={`${field.name}.${l}`}
                defaultValue={group[l] ?? ''}
                dir={l === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          ))}
        </div>
      );
    }

    case 'select':
      return (
        <select {...common} defaultValue={String(value ?? '')} className={INPUT}>
          <option value="" className="bg-background">
            —
          </option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value} className="bg-background">
              {o.label}
            </option>
          ))}
        </select>
      );

    case 'switch':
      return (
        <div className="flex h-10 items-center">
          <Switch name={field.name} defaultChecked={Boolean(value)} />
        </div>
      );

    case 'textarea':
      return (
        <textarea
          {...common}
          rows={4}
          defaultValue={String(value ?? '')}
          className="w-full rounded-md border border-input bg-transparent p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      );

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            defaultValue={String(value ?? '#2c845c')}
            onChange={(e) => {
              const text = document.querySelector<HTMLInputElement>(`input[name="${field.name}"]`);
              if (text) text.value = e.target.value;
            }}
            className="size-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-1"
            aria-label={field.label}
          />
          <input
            {...common}
            defaultValue={String(value ?? '#2c845c')}
            pattern="#[0-9a-fA-F]{6}"
            dir="ltr"
            className={cn(INPUT, 'font-mono text-xs')}
          />
        </div>
      );

    default:
      return (
        <Input
          {...common}
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
          defaultValue={String(value ?? '')}
          required={field.required}
        />
      );
  }
}

function RecordForm({
  table,
  fields,
  row,
  dict,
  onDone,
}: {
  table: string;
  fields: Field[];
  row: RecordRow | null;
  dict: ManagerDict;
  onDone: () => void;
}) {
  const [pending, start] = React.useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const res = await saveRecord(null, formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(dict.saved);
        onDone();
      }
    });
  }

  return (
    <form action={submit} className="space-y-5 rounded-lg border border-primary/30 bg-card p-5">
      <input type="hidden" name="table" value={table} />
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div
            key={field.name}
            className={cn(
              'space-y-1.5',
              field.type === 'i18n' || field.span === 3
                ? 'sm:col-span-2 lg:col-span-3'
                : field.span === 2 && 'sm:col-span-2',
            )}
          >
            {field.type !== 'i18n' && (
              <Label className="text-xs text-muted-foreground">
                {field.label}
                {field.required && <span className="ms-1 text-primary">*</span>}
              </Label>
            )}
            <FieldInput field={field} value={row?.values[field.name]} />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="gold" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {dict.save}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          <X className="size-3.5" />
          {dict.cancel}
        </Button>
      </div>
    </form>
  );
}

export function RecordManager({
  table,
  fields,
  rows,
  dict,
}: {
  table: string;
  fields: Field[];
  rows: RecordRow[];
  dict: ManagerDict;
}) {
  const [items, setItems] = React.useState(rows);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, start] = React.useTransition();

  // Pick up the server's fresh rows after a save — without this a record you
  // just created is invisible until a hard reload, and cannot be reopened.
  React.useEffect(() => {
    setItems(rows);
  }, [rows]);

  return (
    <div className="space-y-5">
      {adding ? (
        <RecordForm table={table} fields={fields} row={null} dict={dict} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="gold" size="sm" onClick={() => setAdding(true)}>
          <Plus />
          {dict.add}
        </Button>
      )}

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{dict.empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) =>
            editing === row.id ? (
              <RecordForm
                key={row.id}
                table={table}
                fields={fields}
                row={row}
                dict={dict}
                onDone={() => setEditing(null)}
              />
            ) : (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="text-sm font-medium">{row.primary}</p>
                  {row.secondary && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.secondary}</p>
                  )}
                </div>

                {row.badge && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {row.badge}
                  </span>
                )}

                <div className="ms-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${dict.edit} — ${row.primary}`}
                    title={dict.edit}
                    onClick={() => setEditing(row.id)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <ConfirmButton
                    label={`${dict.delete} — ${row.primary}`}
                    confirmLabel={dict.confirmDelete}
                    cancelLabel={dict.cancel}
                    disabled={pending}
                    className="inline-flex h-8 items-center rounded-md px-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    onConfirm={() =>
                      start(async () => {
                        const res = await deleteRecord(table, row.id);
                        if (!res.ok) toast.error(res.error);
                        else setItems((prev) => prev.filter((r) => r.id !== row.id));
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </ConfirmButton>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
