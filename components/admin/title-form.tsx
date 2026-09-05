// components/admin/title-form.tsx
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { saveTitle } from '@/app/[lang]/admin/(dashboard)/title-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export type TitleFormValues = {
  id?: string;
  slug: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  synopsis: Record<string, string>;
  kind: string;
  region: string;
  status: string;
  year: number | null;
  seasons_count: number;
  episodes_count: number;
  genres: string[];
  production_country: string | null;
  original_language: string;
  subtitle_langs: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  youtube_id: string | null;
  is_featured_slider: boolean;
  is_hit: boolean;
  is_new: boolean;
  is_coming_soon: boolean;
  is_script: boolean;
  sort_order: number;
};

const LANGS = ['ar', 'en', 'fr'] as const;
const KINDS = ['series', 'show', 'movie', 'animation'];
const REGIONS = ['levant', 'egypt', 'arabia', 'maghreb', 'other'];
const STATUSES = ['draft', 'in_review', 'published', 'archived'];

function SaveBar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function TitleForm({
  lang,
  values,
  labels,
}: {
  lang: Locale;
  values: TitleFormValues;
  labels: { save: string; saved: string };
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveTitle, null);
  const [tab, setTab] = React.useState<(typeof LANGS)[number]>('ar');

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(labels.saved);
    else toast.error(state.error);
  }, [state, labels.saved]);

  return (
    <form action={formAction} className="space-y-10 pb-24">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {/* Localized block */}
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
            <Field label={`Title (${l})`}>
              <Input name={`title_${l}`} defaultValue={values.title[l] ?? ''} dir={l === 'ar' ? 'rtl' : 'ltr'} />
            </Field>
            <Field label={`Subtitle (${l})`}>
              <Input name={`subtitle_${l}`} defaultValue={values.subtitle[l] ?? ''} dir={l === 'ar' ? 'rtl' : 'ltr'} />
            </Field>
            <Field label={`Synopsis (${l})`}>
              <textarea
                name={`synopsis_${l}`}
                defaultValue={values.synopsis[l] ?? ''}
                dir={l === 'ar' ? 'rtl' : 'ltr'}
                rows={5}
                className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          </div>
        ))}
      </section>

      {/* Facts */}
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Slug">
          <Input name="slug" defaultValue={values.slug} dir="ltr" required pattern="[a-z0-9-]+" />
        </Field>
        <Field label="Kind">
          <select name="kind" defaultValue={values.kind} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {KINDS.map((k) => <option key={k} value={k} className="bg-background">{k}</option>)}
          </select>
        </Field>
        <Field label="Region">
          <select name="region" defaultValue={values.region} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {REGIONS.map((r) => <option key={r} value={r} className="bg-background">{r}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={values.status} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {STATUSES.map((s) => <option key={s} value={s} className="bg-background">{s}</option>)}
          </select>
        </Field>
        <Field label="Year"><Input name="year" type="number" defaultValue={values.year ?? ''} dir="ltr" /></Field>
        <Field label="Seasons"><Input name="seasons_count" type="number" min={0} defaultValue={values.seasons_count} dir="ltr" /></Field>
        <Field label="Episodes"><Input name="episodes_count" type="number" min={0} defaultValue={values.episodes_count} dir="ltr" /></Field>
        <Field label="Genres (comma separated)">
          <Input name="genres" defaultValue={values.genres.join(', ')} dir="ltr" placeholder="drama, romance" />
        </Field>
        <Field label="Country (2 letters)">
          <Input name="production_country" maxLength={2} defaultValue={values.production_country ?? ''} dir="ltr" />
        </Field>
        <Field label="Language (2 letters)">
          <Input name="original_language" maxLength={2} defaultValue={values.original_language} dir="ltr" />
        </Field>
        <Field label="Subtitles (comma separated)">
          <Input name="subtitle_langs" defaultValue={values.subtitle_langs.join(', ')} dir="ltr" placeholder="en, fr" />
        </Field>
        <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={values.sort_order} dir="ltr" /></Field>
      </section>

      {/* Media */}
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        <Field label="Poster URL"><Input name="poster_url" type="url" defaultValue={values.poster_url ?? ''} dir="ltr" /></Field>
        <Field label="Backdrop URL"><Input name="backdrop_url" type="url" defaultValue={values.backdrop_url ?? ''} dir="ltr" /></Field>
        <Field label="YouTube ID"><Input name="youtube_id" defaultValue={values.youtube_id ?? ''} dir="ltr" placeholder="dQw4w9WgXcQ" /></Field>
      </section>

      {/* Flags */}
      <section className="flex flex-wrap gap-8 rounded-lg border border-border bg-card p-5">
        {([
          ['is_featured_slider', 'Hero slider'],
          ['is_hit', 'Our hits'],
          ['is_new', 'New'],
          ['is_coming_soon', 'Coming soon'],
          ['is_script', 'Script library'],
        ] as const).map(([name, label]) => (
          <label key={name} className="flex cursor-pointer items-center gap-2.5">
            <Switch name={name} defaultChecked={values[name]} />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-6 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <SaveBar label={labels.save} />
          {values.id && (
            <Link
              href={`/${lang}/series/${values.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="size-3.5" />
              {values.slug}
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
