// components/admin/video-manager.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, X, Star } from 'lucide-react';

import { saveTitleVideo, deleteTitleVideo } from '@/app/[lang]/admin/(dashboard)/video-actions';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Field } from '@/components/admin/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const KINDS = ['trailer', 'teaser', 'clip', 'opening', 'behind_scenes', 'interview', 'promo'] as const;
type Kind = (typeof KINDS)[number];

export type VideoRow = {
  id: string;
  kind: Kind;
  label: Record<string, string>;
  youtube_id: string | null;
  url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean;
  sort_order: number;
};

export type VideoDict = {
  videos: string; addVideo: string; kind: string; label: string;
  youtube: string; url: string; thumb: string; duration: string;
  primary: string; empty: string;
  save: string; saved: string; cancel: string; edit: string;
  delete: string; confirmDelete: string;
  kinds: Record<string, string>;
};

const LANGS = ['ar', 'en', 'fr'] as const;

function VideoForm({
  seriesId,
  row,
  dict,
  onDone,
}: {
  seriesId: string;
  row?: VideoRow;
  dict: VideoDict;
  onDone: () => void;
}) {
  const [kind, setKind] = React.useState<Kind>(row?.kind ?? 'trailer');
  const [label, setLabel] = React.useState<Record<string, string>>(row?.label ?? {});
  const [youtube, setYoutube] = React.useState(row?.youtube_id ?? '');
  const [url, setUrl] = React.useState(row?.url ?? '');
  const [thumb, setThumb] = React.useState(row?.thumbnail_url ?? '');
  const [duration, setDuration] = React.useState(row?.duration_seconds?.toString() ?? '');
  const [isPrimary, setIsPrimary] = React.useState(row?.is_primary ?? false);
  const [pending, start] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveTitleVideo({
        id: row?.id,
        seriesId,
        kind,
        label,
        youtubeInput: youtube.trim() || undefined,
        url: url.trim(),
        thumbnailUrl: thumb.trim(),
        durationSeconds: duration.trim() ? Number(duration) : null,
        isPrimary,
        sortOrder: row?.sort_order ?? 0,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(dict.saved);
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.kind}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {dict.kinds[k] ?? k}
              </option>
            ))}
          </select>
        </Field>

        <Field label={dict.duration} hint="mm:ss is not accepted — enter whole seconds.">
          <Input
            type="number"
            min={1}
            max={86399}
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="102"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {LANGS.map((lang) => (
          <Field key={lang} label={`${dict.label} · ${lang.toUpperCase()}`}>
            <Input
              value={label[lang] ?? ''}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              onChange={(e) => setLabel((prev) => ({ ...prev, [lang]: e.target.value }))}
            />
          </Field>
        ))}
      </div>

      <Field
        label={dict.youtube}
        hint="Paste the watch, share or shorts link — the id is extracted for you."
      >
        <Input value={youtube} dir="ltr" onChange={(e) => setYoutube(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.url} hint="Use this instead of YouTube for a self-hosted file.">
          <Input value={url} dir="ltr" onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <Field label={dict.thumb} hint="Optional for YouTube — its own thumbnail is used.">
          <Input value={thumb} dir="ltr" onChange={(e) => setThumb(e.target.value)} />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="size-4 rounded border-input accent-primary"
        />
        <span className="text-muted-foreground">{dict.primary}</span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={pending} size="sm">
          {pending && <Loader2 className="me-2 size-3.5 animate-spin" />}
          {dict.save}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          <X className="me-1.5 size-3.5" />
          {dict.cancel}
        </Button>
      </div>
    </form>
  );
}

/**
 * The reel attached to one title.
 *
 * `series` carried a single trailer_url, so a teaser or a behind-the-scenes
 * clip had nowhere to go and the title page could only ever show one video.
 * This is the editor for the title_videos table behind the new theatre.
 */
export function VideoManager({
  seriesId,
  rows,
  dict,
}: {
  seriesId: string;
  rows: VideoRow[];
  dict: VideoDict;
}) {
  const [items, setItems] = React.useState(rows);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, start] = React.useTransition();

  // Pick up the server's fresh rows after a save — without this a video you
  // just added is invisible until a hard reload.
  React.useEffect(() => {
    setItems(rows);
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {dict.videos}
          <span className="ms-2 text-muted-foreground/50">{items.length}</span>
        </p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => { setAdding(true); setEditing(null); }}>
            <Plus className="me-1.5 size-3.5" />
            {dict.addVideo}
          </Button>
        )}
      </div>

      {adding && (
        <VideoForm seriesId={seriesId} dict={dict} onDone={() => setAdding(false)} />
      )}

      {items.length === 0 && !adding ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {dict.empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => {
            const thumb =
              row.thumbnail_url ??
              (row.youtube_id ? `https://i.ytimg.com/vi/${row.youtube_id}/hqdefault.jpg` : null);
            const name = row.label.en || row.label.ar || row.label.fr || dict.kinds[row.kind] || row.kind;

            return (
              <li key={row.id}>
                {editing === row.id ? (
                  <VideoForm
                    seriesId={seriesId}
                    row={row}
                    dict={dict}
                    onDone={() => setEditing(null)}
                  />
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded bg-muted">
                      {thumb && (
                        <Image src={thumb} alt="" fill sizes="112px" className="object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {name}
                        {row.is_primary && (
                          <span
                            title={dict.primary}
                            className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-primary"
                          >
                            <Star className="size-2.5 fill-current" />
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
                        {dict.kinds[row.kind] ?? row.kind}
                        {' · '}
                        {row.youtube_id ?? row.url}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${dict.edit} — ${name}`}
                        title={dict.edit}
                        onClick={() => { setEditing(row.id); setAdding(false); }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <ConfirmButton
                        label={`${dict.delete} — ${name}`}
                        confirmLabel={dict.confirmDelete}
                        cancelLabel={dict.cancel}
                        disabled={pending}
                        className={cn(
                          'inline-flex h-8 items-center rounded-md px-2 text-destructive',
                          'transition-colors hover:bg-destructive/10 disabled:opacity-50',
                        )}
                        onConfirm={() =>
                          start(async () => {
                            const res = await deleteTitleVideo(row.id);
                            if (!res.ok) toast.error(res.error);
                            else setItems((prev) => prev.filter((r) => r.id !== row.id));
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </ConfirmButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
