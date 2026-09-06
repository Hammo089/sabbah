'use client';

// components/admin/season-details.tsx — CLIENT COMPONENT
// The "Details" tab, rebuilt from the CAPDAMS layout: Region / ID / Country /
// SeasCode / ProgCode across the top, then the four checkbox grids — Genres,
// Audio, Dubbing, Subtitling — each with its English and Arabic summary box
// underneath, and Remarks at the bottom.
//
// The summary boxes are COMPUTED from the checkboxes, never typed. On the old
// form they were separate fields, which is how a season ended up tagged
// "Drama, Social" in English and "دراما" alone in Arabic.
import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveSeasonDetails } from '@/app/[lang]/admin/(dashboard)/season-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import {
  GENRES, LANGUAGES, SUBTITLE_LANGUAGES, REGIONS, joinTerms, type Term,
} from '@/lib/admin/season-taxonomy';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SeasonDetailValues = {
  id: string;
  region: string;
  production_country: string | null;
  seas_code: string | null;
  prog_code: string | null;
  remarks: string | null;
  genres: string[];
  audio_langs: string[];
  dubbing_langs: string[];
  subtitling_langs: string[];
};

export type DetailsDict = {
  region: string; country: string; seasCode: string; progCode: string;
  genres: string; audio: string; dubbing: string; subtitling: string;
  remarks: string; save: string; saved: string; none: string;
};

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

/**
 * One checkbox grid plus its two computed summary boxes — the repeating unit of
 * the old layout.
 */
function TermGrid({
  title,
  name,
  vocab,
  selected,
  onChange,
  columns = 3,
  none,
}: {
  title: string;
  name: string;
  vocab: Term[];
  selected: string[];
  onChange: (next: string[]) => void;
  columns?: 1 | 2 | 3;
  none: string;
}) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const en = joinTerms(selected, vocab, 'en');
  const ar = joinTerms(selected, vocab, 'ar');

  return (
    <div className="flex flex-col">
      {/* Every checked box is submitted under the same name — the action reads
          them with formData.getAll(). */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}

      <p className="rounded-t-md border border-border bg-muted/50 px-3 py-1.5 text-center text-xs font-medium">
        {title}
      </p>

      <div
        className={cn(
          'grid gap-x-3 gap-y-1.5 border-x border-border p-3',
          columns === 3 ? 'grid-cols-2 lg:grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        {vocab.map((term) => {
          const on = selected.includes(term.value);
          return (
            <label
              key={term.value}
              className="flex cursor-pointer items-center gap-2 text-[0.78rem] leading-tight"
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(term.value)}
                className="size-3.5 shrink-0 accent-[hsl(var(--primary))]"
              />
              <span className={cn('truncate', on && 'text-foreground', !on && 'text-muted-foreground')}>
                {term.en}
              </span>
            </label>
          );
        })}
      </div>

      <div className="space-y-2 rounded-b-md border border-border p-3">
        <div
          className="min-h-[3.25rem] rounded-md border border-primary/40 p-2.5 text-xs leading-relaxed"
          dir="ltr"
        >
          {en || <span className="text-muted-foreground/60">{none}</span>}
        </div>
        <div
          className="min-h-[3.25rem] rounded-md border border-primary/40 p-2.5 text-end text-xs leading-relaxed"
          dir="rtl"
        >
          {ar || <span className="text-muted-foreground/60">{none}</span>}
        </div>
      </div>
    </div>
  );
}

export function SeasonDetails({
  values,
  dict,
}: {
  values: SeasonDetailValues;
  dict: DetailsDict;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveSeasonDetails, null);

  const [genres, setGenres] = React.useState(values.genres);
  const [audio, setAudio] = React.useState(values.audio_langs);
  const [dubbing, setDubbing] = React.useState(values.dubbing_langs);
  const [subtitling, setSubtitling] = React.useState(values.subtitling_langs);

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(dict.saved);
    else toast.error(state.error);
  }, [state, dict.saved]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={values.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{dict.region}</Label>
          <select
            name="region"
            defaultValue={values.region}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value} className="bg-background">
                {r.en}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{dict.country}</Label>
          <Input name="production_country" defaultValue={values.production_country ?? ''} maxLength={2} dir="ltr" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{dict.seasCode}</Label>
          <Input name="seas_code" defaultValue={values.seas_code ?? ''} maxLength={20} dir="ltr" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{dict.progCode}</Label>
          <Input name="prog_code" defaultValue={values.prog_code ?? ''} maxLength={20} dir="ltr" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">ID</Label>
          <Input value={values.id.slice(0, 8).toUpperCase()} readOnly dir="ltr" className="opacity-60" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <TermGrid
          title={dict.genres}
          name="genres"
          vocab={GENRES}
          selected={genres}
          onChange={setGenres}
          columns={3}
          none={dict.none}
        />
        <TermGrid
          title={dict.audio}
          name="audio_langs"
          vocab={LANGUAGES}
          selected={audio}
          onChange={setAudio}
          columns={2}
          none={dict.none}
        />
        <TermGrid
          title={dict.dubbing}
          name="dubbing_langs"
          vocab={LANGUAGES}
          selected={dubbing}
          onChange={setDubbing}
          columns={2}
          none={dict.none}
        />
        <TermGrid
          title={dict.subtitling}
          name="subtitling_langs"
          vocab={SUBTITLE_LANGUAGES}
          selected={subtitling}
          onChange={setSubtitling}
          columns={1}
          none={dict.none}
        />
      </div>

      <div className="max-w-md space-y-1.5">
        <Label className="text-xs text-muted-foreground">{dict.remarks}</Label>
        <textarea
          name="remarks"
          rows={3}
          defaultValue={values.remarks ?? ''}
          maxLength={2000}
          className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <SaveBtn label={dict.save} />
    </form>
  );
}
